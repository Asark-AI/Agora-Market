'use server';

import 'server-only';

import { createHash, randomUUID } from 'node:crypto';
import { generateGoalShoppingPlan, ShoppingGoalInputSchema, type ShoppingGoalInput, type ShoppingGoalOutput } from '@/ai/flows/plan-shopping-goal';
import { AI_SHOPPING_LIMITS, applyShoppingPlanEdit, calculateSafeSelection, createShoppingPlanState, planEditHistory, shoppingToolCallLimit, type ShoppingPlanInput, type ShoppingPlanState } from '@/lib/ai-shopping-state';
import { categories, regions } from '@/lib/data';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyMarketplaceSession } from '@/lib/server/admin-auth';
import type { CatalogCartProduct, Product } from '@/lib/types';
import type { Query, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { z } from 'zod';

export type CatalogMatch = {
  product: CatalogCartProduct;
  sellerName: string;
  sellerVerified: boolean;
  sellerRegion: string;
  sellerRegionName: string;
  currentPrice: number;
  stock: number;
  reason: string;
  compatibility: 'verified' | 'likely' | 'unknown';
  deliveryAvailability: 'verified' | 'unknown';
};

export type GroundedShoppingPlan = {
  plan: ShoppingGoalOutput;
  state: ShoppingPlanState;
  matches: CatalogMatch[];
  searchMayBeIncomplete: boolean;
  selectionNotice?: string;
};

const MAX_CANDIDATES = AI_SHOPPING_LIMITS.catalogCandidates;
const PAGE_SIZE = AI_SHOPPING_LIMITS.catalogPageSize;
const MAX_RESULTS = AI_SHOPPING_LIMITS.resultCount;
const SHOPPING_PLAN_ASSUMPTIONS = [
  'Shown products are current active listings with positive stock at search time.',
  'Compatibility could not be verified from the available product information.',
  'Delivery availability could not be verified; seller region is not a delivery guarantee.',
];

class ShoppingToolRateLimitError extends Error {
  constructor() {
    super('Agora AI shopping tools are temporarily rate limited. Please wait a moment and try again.');
    this.name = 'ShoppingToolRateLimitError';
  }
}

async function runAuditedShoppingTool<T>(
  tool: 'catalog_search' | 'plan_edit' | 'selection_refresh',
  operation: () => Promise<T>
): Promise<T> {
  const identity = await verifyMarketplaceSession();
  const actorId = identity?.uid || 'anonymous';
  const db = getAdminDb();
  const requestId = randomUUID();
  const startedAt = Date.now();
  const bucketId = createHash('sha256').update(actorId).digest('hex');
  const bucketRef = db.collection('aiShoppingRateLimits').doc(bucketId);
  const auditRef = db.collection('aiShoppingToolAudit').doc();
  const now = Date.now();
  const windowStart = Math.floor(now / 60_000) * 60_000;
  const limit = shoppingToolCallLimit(Boolean(identity));
  let rateLimited = false;
  let writeRateLimitAudit = false;

  await db.runTransaction(async (transaction) => {
    rateLimited = false;
    writeRateLimitAudit = false;
    const bucket = await transaction.get(bucketRef);
    const data = bucket.data();
    const currentWindow = Number(data?.windowStart || 0);
    const count = currentWindow === windowStart ? Number(data?.count || 0) : 0;
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new Error('Invalid AI shopping rate-limit bucket state.');
    }
    if (count >= limit) {
    rateLimited = true;
    writeRateLimitAudit = Number(data?.lastRejectedAuditWindow || 0) !== windowStart;
    if (writeRateLimitAudit) {
      transaction.set(bucketRef, { lastRejectedAuditWindow: windowStart }, { merge: true });
    }
    return;
    }
    transaction.set(bucketRef, { windowStart, count: count + 1, expiresAt: new Date(windowStart + 3_600_000) }, { merge: true });
  });

  if (rateLimited) {
    if (writeRateLimitAudit) {
    await auditRef.set({
      requestId,
      tool,
      actorId: identity?.uid || null,
      authorization: 'public catalog read',
      result: 'rate_limited',
      latencyMs: Date.now() - startedAt,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
    }
    throw new ShoppingToolRateLimitError();
  }

  try {
    const output = await operation();
    const productIds = typeof output === 'object' && output !== null && 'matches' in output && Array.isArray(output.matches)
      ? output.matches.flatMap((match: { product?: { id?: unknown } }) => typeof match.product?.id === 'string' ? [match.product.id] : [])
      : [];
    await auditRef.set({
      requestId,
      tool,
      actorId: identity?.uid || null,
      authorization: 'public catalog read',
      result: 'success',
      productIds,
      latencyMs: Date.now() - startedAt,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
    return output;
  } catch (error) {
    const errorCategory = error instanceof z.ZodError ? 'invalid_input' : 'internal_error';
    await auditRef.set({
      requestId,
      tool,
      actorId: identity?.uid || null,
      authorization: 'public catalog read',
      result: 'failure',
      errorCategory,
      latencyMs: Date.now() - startedAt,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
    console.error(JSON.stringify({ event: 'ai_shopping_tool_failure', requestId, tool, errorCategory }));
    throw error;
  }
}
const ShoppingPlanRequestSchema = ShoppingGoalInputSchema.extend({
  onlyVerifiedSellers: z.boolean().default(false),
  sellerRegionId: z.string().trim().max(40).optional().refine((id) => id === undefined || regions.some((region) => region.id === id), 'Choose a known seller region.'),
  deliveryRegionId: z.string().trim().max(40).optional().refine((id) => id === undefined || regions.some((region) => region.id === id), 'Choose a known delivery region.'),
  excludedTerms: z.array(z.string().trim().min(1).max(100)).max(12).default([]),
  pricePriority: z.enum(['balanced', 'lower-cost', 'performance']).default('balanced'),
  onlyPreferredBrands: z.boolean().default(false),
  showAlternatives: z.boolean().default(false),
  selectedProductIds: z.array(z.string().trim().min(1).max(128)).max(MAX_RESULTS).default([]),
}).strict();

const ShoppingPlanStateSchema = z.object({
  goal: ShoppingGoalInputSchema.shape.goal,
  originalGoal: ShoppingGoalInputSchema.shape.goal,
  budget: ShoppingGoalInputSchema.shape.budget,
  originalBudget: ShoppingGoalInputSchema.shape.budget,
  currency: z.literal('GHS'),
  mustHaveFeatures: ShoppingGoalInputSchema.shape.mustHaveFeatures,
  existingItems: ShoppingGoalInputSchema.shape.existingItems,
  preferences: z.object({
    pricePriority: z.enum(['balanced', 'lower-cost', 'performance']),
    preferredBrands: ShoppingGoalInputSchema.shape.preferredBrands,
    onlyPreferredBrands: z.boolean(),
    onlyVerifiedSellers: z.boolean(),
    sellerRegion: z.object({ id: z.string().max(40), name: z.string().max(80) }).optional(),
    requestedDeliveryRegion: z.object({ id: z.string().max(40), name: z.string().max(80) }).optional(),
    excludedTerms: z.array(z.string().trim().min(1).max(100)).max(12),
    showAlternatives: z.boolean(),
  }),
  essentialItems: z.array(z.string().max(128)).max(20),
  optionalItems: z.array(z.string().max(128)).max(20),
  alternatives: z.array(z.string().max(128)).max(20),
  selectedProductIds: z.array(z.string().trim().min(1).max(128)).max(MAX_RESULTS),
  total: z.number().finite().min(0),
  remainingBudget: z.number().finite().optional(),
  constraints: z.array(z.string().max(180)).max(30),
  questions: z.array(z.string().max(180)).max(2),
  assumptions: z.array(z.string().max(180)).max(12),
  editHistory: z.array(z.string().max(500)).max(12),
});

const ShoppingPlanEditSchema = z.object({
  message: z.string().trim().min(1).max(500),
});

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function inferCategoryIds(input: ShoppingPlanInput) {
  const query = normalize([
    input.goal,
    ...input.mustHaveFeatures,
    ...input.preferredBrands,
  ].join(' '));
  const terms = query.split(' ').filter((term) => term.length > 2);
  const inferred = categories
    .filter((category) => category.type === 'product')
    .map((category) => {
      const label = normalize(`${category.name} ${category.parent || ''}`);
      const overlap = terms.filter((term) => label.includes(term)).length;
      return { id: category.id, overlap };
    })
    .filter((category) => category.overlap > 0)
    .sort((left, right) => right.overlap - left.overlap)
    .slice(0, 10)
    .map((category) => category.id);

  if (/\b(pc|computer|gaming|gpu|cpu|graphics)\b/i.test(query)) {
    for (const id of ['electronics-hardware', 'electronics-gaming', 'electronics-accessories']) {
      if (categories.some((category) => category.id === id) && !inferred.includes(id)) inferred.push(id);
    }
  }
  if (/\blaptop|notebook\b/i.test(query) && !inferred.includes('electronics-laptops')) inferred.push('electronics-laptops');
  return inferred.slice(0, 10);
}

function toProduct(id: string, data: Record<string, unknown>, sellerId: string): Product | null {
  const price = Number(data.price);
  const stock = Number(data.stock);
  if (
    typeof data.name !== 'string' ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isInteger(stock) ||
    stock <= 0 ||
    typeof data.categoryId !== 'string'
  ) {
    return null;
  }

  return {
    id,
    name: data.name,
    description: typeof data.description === 'string' ? data.description : '',
    price,
    discountPrice:
      typeof data.discountPrice === 'number' &&
      Number.isFinite(data.discountPrice) &&
      data.discountPrice > 0 &&
      data.discountPrice < price
        ? data.discountPrice
        : undefined,
    images: Array.isArray(data.images) ? data.images.filter((image): image is string => typeof image === 'string') : [],
    videos: [],
    categoryId: data.categoryId,
    sellerId,
    userId: '',
    regionId: typeof data.regionId === 'string' ? data.regionId : '',
    stock,
    status: 'active',
    views: Number.isFinite(Number(data.views)) ? Number(data.views) : 0,
    favorites: Number.isFinite(Number(data.favorites)) ? Number(data.favorites) : 0,
    specifications: Array.isArray(data.specifications)
      ? data.specifications
          .filter((spec): spec is { name: string; value: string } =>
            Boolean(spec) &&
            typeof spec === 'object' &&
            typeof (spec as { name?: unknown }).name === 'string' &&
            typeof (spec as { value?: unknown }).value === 'string'
          )
          .map((spec) => ({ name: spec.name, value: spec.value }))
      : [],
  };
}

function scoreProduct(product: Product, input: ShoppingGoalInput) {
  const goalWords = normalize(input.goal).split(' ').filter((word) => word.length > 2);
  const featureWords = input.mustHaveFeatures.flatMap((feature) => normalize(feature).split(' ')).filter((word) => word.length > 2);
  const brandWords = input.preferredBrands.flatMap((brand) => normalize(brand).split(' ')).filter((word) => word.length > 1);
  const name = normalize(product.name);
  const category = normalize(product.categoryId.replace(/-/g, ' '));
  const specs = normalize((product.specifications || []).map((spec) => `${spec.name} ${spec.value}`).join(' '));
  const description = normalize(typeof product.description === 'string' ? product.description : '');
  let score = 0;

  for (const word of new Set(goalWords)) {
    if (name.includes(word)) score += 4;
    else if (category.includes(word)) score += 3;
    else if (specs.includes(word)) score += 2;
    else if (description.includes(word)) score += 1;
  }
  for (const word of new Set(featureWords)) {
    if (name.includes(word) || specs.includes(word) || description.includes(word)) score += 2;
  }
  for (const word of new Set(brandWords)) {
    if (name.includes(word) || specs.includes(word) || description.includes(word)) score += 3;
  }

  return score;
}

function toCartProduct(product: Product): CatalogCartProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    discountPrice: product.discountPrice,
    images: product.images,
    videos: product.videos,
    productMedia: product.productMedia,
    categoryId: product.categoryId,
    sellerId: product.sellerId,
    regionId: product.regionId,
    stock: product.stock,
    status: product.status,
    specifications: product.specifications,
    views: product.views,
    favorites: product.favorites,
    ratingAverage: product.ratingAverage,
    ratingCount: product.ratingCount,
    ratingTotal: product.ratingTotal,
    soldCount: product.soldCount,
    createdAt: product.createdAt,
  };
}

async function loadCandidatePages(query: Query, maximum: number) {
  const documents: QueryDocumentSnapshot[] = [];
  let cursor: QueryDocumentSnapshot | undefined;
  let exhausted = false;
  while (documents.length < maximum && !exhausted) {
    const pageSize = Math.min(PAGE_SIZE, maximum - documents.length);
    let pageQuery = query.limit(pageSize);
    if (cursor) pageQuery = pageQuery.startAfter(cursor);
    const page = await pageQuery.get();
    documents.push(...page.docs);
    cursor = page.docs[page.docs.length - 1];
    exhausted = page.size < pageSize || page.empty;
  }
  return { documents, reachedLimit: documents.length >= maximum && !exhausted };
}

async function runGroundedShopping(
  input: ShoppingPlanInput & { selectedProductIds?: string[] },
  includeAiNarrative = true
): Promise<GroundedShoppingPlan> {
  const validatedRequest = ShoppingPlanRequestSchema.parse(input);
  const validatedInput = ShoppingGoalInputSchema.parse(validatedRequest);
  const db = getAdminDb();
  const extendedInput = validatedRequest;
  const categoryIds = inferCategoryIds(extendedInput);
  const baseProductQuery = () => {
    let query: Query = db.collectionGroup('products')
      .where('status', '==', 'active')
      .where('stock', '>', 0);
    if (categoryIds.length) query = query.where('categoryId', 'in', categoryIds);
    return query;
  };
  const queryBranches = extendedInput.budget === undefined
    ? [{ query: baseProductQuery(), limit: MAX_CANDIDATES }]
    : [
        { query: baseProductQuery().where('price', '<=', extendedInput.budget), limit: MAX_CANDIDATES / 2 },
        { query: baseProductQuery().where('discountPrice', '>', 0).where('discountPrice', '<=', extendedInput.budget), limit: MAX_CANDIDATES / 2 },
      ];
  const pagedBranches = await Promise.all(queryBranches.map(({ query, limit }) => loadCandidatePages(query, limit)));
  const uniqueProductDocs = new Map<string, QueryDocumentSnapshot>();
  for (const branch of pagedBranches) {
    for (const document of branch.documents) uniqueProductDocs.set(document.ref.path, document);
  }
  const productDocs = [...uniqueProductDocs.values()].slice(0, MAX_CANDIDATES);
  const searchMayBeIncomplete = pagedBranches.some((branch) => branch.reachedLimit) || uniqueProductDocs.size > MAX_CANDIDATES;
  const sellerIds = [...new Set(productDocs.map((document) => document.ref.parent.parent?.id).filter((id): id is string => !!id))];
  const sellerSnapshots = await Promise.all(
    Array.from({ length: Math.ceil(sellerIds.length / 100) }, (_, index) =>
      db.getAll(...sellerIds.slice(index * 100, (index + 1) * 100).map((sellerId) => db.collection('sellers').doc(sellerId)))
    )
  );
  const sellersById = new Map(sellerSnapshots.flat().map((seller) => [seller.id, seller.data()]));

  const candidates = productDocs.flatMap((document) => {
    const sellerId = document.ref.parent.parent?.id;
    if (!sellerId) return [];
    const seller = sellersById.get(sellerId);
    if (!seller || seller.status !== 'active') return [];
    if (extendedInput.onlyVerifiedSellers && seller.isVerifiedArtisan !== true) return [];
    if (extendedInput.sellerRegionId && seller.regionId !== extendedInput.sellerRegionId) return [];

    const product = toProduct(document.id, document.data(), sellerId);
    if (!product) return [];
    const currentPrice = product.discountPrice !== undefined && product.discountPrice < product.price ? product.discountPrice : product.price;
    if (validatedInput.budget !== undefined && currentPrice > validatedInput.budget) return [];
    const searchable = normalize([
      product.name,
      typeof product.description === 'string' ? product.description : '',
      product.categoryId,
      ...(product.specifications || []).map((spec) => `${spec.name} ${spec.value}`),
    ].join(' '));
    const productIdentity = normalize(`${product.name} ${product.categoryId}`);
    if ((extendedInput.excludedTerms || []).some((term) => productIdentity.includes(normalize(term)))) return [];
    if (extendedInput.onlyPreferredBrands && !extendedInput.preferredBrands.some((brand) => searchable.includes(normalize(brand)))) return [];
    const score = scoreProduct(product, validatedInput);
    return score > 0
      ? [{
          product,
          score,
          sellerName: typeof seller.name === 'string' ? seller.name : 'Agora seller',
          sellerVerified: seller.isVerifiedArtisan === true,
          sellerRegion: typeof seller.regionId === 'string' ? seller.regionId : '',
          sellerRegionName: typeof seller.regionId === 'string'
            ? regions.find(({ id }) => id === seller.regionId)?.name || ''
            : '',
        }]
      : [];
  });

  const matches = candidates
    .sort((left, right) => {
      const leftPrice = left.product.discountPrice !== undefined && left.product.discountPrice < left.product.price ? left.product.discountPrice : left.product.price;
      const rightPrice = right.product.discountPrice !== undefined && right.product.discountPrice < right.product.price ? right.product.discountPrice : right.product.price;
      const leftOverBudget = validatedInput.budget !== undefined && leftPrice > validatedInput.budget ? 1 : 0;
      const rightOverBudget = validatedInput.budget !== undefined && rightPrice > validatedInput.budget ? 1 : 0;
      const priceOrder = extendedInput.pricePriority === 'lower-cost' || extendedInput.showAlternatives
        ? leftPrice - rightPrice
        : extendedInput.pricePriority === 'performance'
          ? right.score - left.score
          : right.score - left.score || leftPrice - rightPrice;
      return leftOverBudget - rightOverBudget || priceOrder;
    })
    .slice(0, MAX_RESULTS)
    .map(({ product, sellerName, sellerVerified, sellerRegion, sellerRegionName, score }) => {
      const currentPrice = product.discountPrice !== undefined && product.discountPrice < product.price ? product.discountPrice : product.price;
      const reasons = ['Active product from an active Agora seller', `${product.stock} in stock`];
      if (validatedInput.budget !== undefined) reasons.push('Within your stated budget as an individual item');
      if (score >= 4) reasons.push('Matched to terms in your goal or requirements');
      if (sellerVerified) reasons.push('Agora-verified seller');
      if (sellerRegionName) reasons.push(`Seller-listed region: ${sellerRegionName}`);
      return {
        product: toCartProduct(product),
        sellerName,
        sellerVerified,
        sellerRegion,
        sellerRegionName,
        currentPrice,
        stock: product.stock,
        reason: reasons.join(' · '),
        compatibility: 'unknown' as const,
        deliveryAvailability: 'unknown' as const,
      };
    });

  const generatedPlan = includeAiNarrative
    ? await generateGoalShoppingPlan(validatedInput, matches.length)
    : {
        summary: matches.length ? `Refreshed ${matches.length} current catalog matches.` : 'No matching products are currently available.',
        followUpQuestions: [],
        recommendation: 'Review the refreshed listing facts. No product compatibility or delivery claims have been verified.',
      };

  const selectedRequested = validatedRequest.selectedProductIds;
  const selection = calculateSafeSelection(
    matches.map(({ product, currentPrice }) => ({ id: product.id, price: currentPrice })),
    selectedRequested,
    validatedInput.budget
  );
  const selectedProductIds = selection.productIds;
  const questions = [
    ...generatedPlan.followUpQuestions,
    ...(matches.some((match) => match.compatibility === 'unknown') ? ['Compatibility could not be verified from the available product information.'] : []),
  ].slice(0, 2);
  const state = createShoppingPlanState(
    {
      ...validatedInput,
      onlyVerifiedSellers: extendedInput.onlyVerifiedSellers,
      onlyPreferredBrands: extendedInput.onlyPreferredBrands,
      sellerRegionId: extendedInput.sellerRegionId,
      deliveryRegionId: extendedInput.deliveryRegionId,
      excludedTerms: extendedInput.excludedTerms,
      pricePriority: extendedInput.pricePriority,
      showAlternatives: extendedInput.showAlternatives,
    },
    matches.map(({ product }) => product.id),
    selectedProductIds,
    selection.total,
    questions,
    SHOPPING_PLAN_ASSUMPTIONS
  );
  return {
    plan: {
      ...generatedPlan,
      summary: matches.length
        ? `I found ${matches.length} relevant, in-stock Agora listing${matches.length === 1 ? '' : 's'} for your goal.`
        : 'No sufficiently relevant, in-stock Agora listings were found for your goal in the current catalog search.',
      recommendation: matches.length
        ? 'These results are live listings, not a verified bundle. Review their specifications and compatibility before selecting items; checkout rechecks price and stock.'
        : 'Try refining your goal with a product category, preferred brand, or key specification. No substitute items or prices have been invented.',
    },
    state,
    matches,
    searchMayBeIncomplete,
    selectionNotice: selection.notice,
  };
}

export async function planGroundedShopping(input: ShoppingPlanInput): Promise<GroundedShoppingPlan> {
  return runAuditedShoppingTool('catalog_search', () => runGroundedShopping(input));
}

function inputFromState(state: ShoppingPlanState): ShoppingPlanInput {
  return {
    goal: state.originalGoal,
    budget: state.budget,
    preferredBrands: state.preferences.preferredBrands,
    onlyPreferredBrands: state.preferences.onlyPreferredBrands,
    existingItems: state.existingItems,
    mustHaveFeatures: state.mustHaveFeatures,
    onlyVerifiedSellers: state.preferences.onlyVerifiedSellers,
    sellerRegionId: state.preferences.sellerRegion?.id,
    deliveryRegionId: state.preferences.requestedDeliveryRegion?.id,
    excludedTerms: state.preferences.excludedTerms,
    pricePriority: state.preferences.pricePriority,
    showAlternatives: state.preferences.showAlternatives,
  };
}

export async function editGroundedShoppingPlan(stateInput: ShoppingPlanState, editInput: { message: string }) {
  return runAuditedShoppingTool('plan_edit', async () => {
    const state = ShoppingPlanStateSchema.parse(stateInput);
    const { message } = ShoppingPlanEditSchema.parse(editInput);
    const edited = applyShoppingPlanEdit(state, message);
    const result = await runGroundedShopping({
      ...edited,
      selectedProductIds: state.selectedProductIds,
    });
    result.state.originalGoal = state.originalGoal;
    result.state.originalBudget = state.originalBudget;
    result.state.editHistory = planEditHistory(state, message);
    result.state.questions = result.plan.followUpQuestions;
    return result;
  });
}

export async function refreshGroundedShoppingSelection(stateInput: ShoppingPlanState, selectedProductIds: string[]) {
  return runAuditedShoppingTool('selection_refresh', async () => {
    const state = ShoppingPlanStateSchema.parse(stateInput);
    const selectedIds = z.array(z.string().trim().min(1).max(128)).max(MAX_RESULTS).parse(selectedProductIds);
    const input = inputFromState(state);
    const result = await runGroundedShopping({
      ...input,
      selectedProductIds: selectedIds,
    }, false);
    result.state.originalGoal = state.originalGoal;
    result.state.originalBudget = state.originalBudget;
    result.state.editHistory = state.editHistory;
    result.state.questions = state.questions;
    result.plan.followUpQuestions = state.questions;
    return result;
  });
}

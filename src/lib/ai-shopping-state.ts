import { regions } from './regions.ts';

export type ShoppingPlanPreferences = {
  pricePriority: 'balanced' | 'lower-cost' | 'performance';
  preferredBrands: string[];
  onlyPreferredBrands: boolean;
  onlyVerifiedSellers: boolean;
  sellerRegion?: { id: string; name: string };
  requestedDeliveryRegion?: { id: string; name: string };
  excludedTerms: string[];
  showAlternatives: boolean;
};

export type ShoppingPlanState = {
  goal: string;
  budget?: number;
  currency: 'GHS';
  mustHaveFeatures: string[];
  existingItems: string[];
  preferences: ShoppingPlanPreferences;
  originalGoal: string;
  originalBudget?: number;
  essentialItems: string[];
  optionalItems: string[];
  alternatives: string[];
  selectedProductIds: string[];
  total: number;
  remainingBudget?: number;
  constraints: string[];
  questions: string[];
  assumptions: string[];
  editHistory: string[];
};

export type ShoppingPlanInput = {
  goal: string;
  budget?: number;
  preferredBrands: string[];
  onlyPreferredBrands?: boolean;
  existingItems: string[];
  mustHaveFeatures: string[];
  onlyVerifiedSellers?: boolean;
  sellerRegionId?: string;
  deliveryRegionId?: string;
  excludedTerms?: string[];
  pricePriority?: ShoppingPlanPreferences['pricePriority'];
  showAlternatives?: boolean;
};

export type SelectionPrice = { id: string; price: number };
export type SafeSelection = { productIds: string[]; total: number; notice?: string };

const MAX_EDIT_HISTORY = 12;
const MAX_LIST_ITEMS = 12;
const MAX_SELECTED_ITEMS = 8;
export const AI_SHOPPING_LIMITS = { authenticatedPerMinute: 12, anonymousPerMinute: 30, catalogCandidates: 500, catalogPageSize: 100, resultCount: MAX_SELECTED_ITEMS } as const;

export function shoppingToolCallLimit(authenticated: boolean) {
  return authenticated ? AI_SHOPPING_LIMITS.authenticatedPerMinute : AI_SHOPPING_LIMITS.anonymousPerMinute;
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, MAX_LIST_ITEMS);
}

function matchRegion(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  return regions.find((region) => region.name.toLowerCase() === normalized)
    || regions.find((region) => region.name.toLowerCase().includes(normalized) && normalized.length >= 4);
}

function explicitBudget(message: string) {
  const match = message.match(/(?:gh₵|ghs|under|below|maximum|max(?:imum)?(?: budget)?(?: of)?|keep (?:it|the total) under)\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (!match) return undefined;
  const amount = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(amount) && amount >= 0 && amount <= 1_000_000 ? amount : undefined;
}

export function createShoppingPlanState(
  input: ShoppingPlanInput,
  catalogProductIds: string[],
  selectedProductIds: string[],
  total: number,
  questions: string[],
  assumptions: string[] = []
): ShoppingPlanState {
  const selected = selectedProductIds.filter((id) => catalogProductIds.includes(id));
  return {
    goal: input.goal,
    originalGoal: input.goal,
    budget: input.budget,
    originalBudget: input.budget,
    currency: 'GHS',
    mustHaveFeatures: unique(input.mustHaveFeatures),
    existingItems: unique(input.existingItems),
    preferences: {
      pricePriority: input.pricePriority ?? 'balanced',
      preferredBrands: unique(input.preferredBrands),
      onlyPreferredBrands: input.onlyPreferredBrands ?? false,
      onlyVerifiedSellers: input.onlyVerifiedSellers ?? false,
      sellerRegion: input.sellerRegionId ? regions.find(({ id }) => id === input.sellerRegionId) : undefined,
      requestedDeliveryRegion: input.deliveryRegionId ? regions.find(({ id }) => id === input.deliveryRegionId) : undefined,
      excludedTerms: unique(input.excludedTerms ?? []),
      showAlternatives: input.showAlternatives ?? false,
    },
    essentialItems: [],
    optionalItems: [],
    alternatives: catalogProductIds.filter((id) => !selected.includes(id)),
    selectedProductIds: selected,
    total: Number(total.toFixed(2)),
    remainingBudget: input.budget === undefined ? undefined : Number((input.budget - total).toFixed(2)),
    constraints: [
      ...(input.budget === undefined ? [] : [`Maximum total: GH₵${input.budget.toLocaleString('en-GH')}`]),
      ...(input.onlyVerifiedSellers ? ['Only verified Agora sellers'] : []),
      ...(input.onlyPreferredBrands ? [`Only preferred brands: ${unique(input.preferredBrands).join(', ')}`] : []),
      ...(input.sellerRegionId
        ? [`Seller-listed region: ${regions.find(({ id }) => id === input.sellerRegionId)?.name || 'selected region'}; this is not a delivery guarantee`]
        : []),
      ...(input.deliveryRegionId
        ? [`Delivery to ${regions.find(({ id }) => id === input.deliveryRegionId)?.name || 'selected region'} requested; availability is not verified`]
        : []),
      ...unique(input.mustHaveFeatures).map((feature) => `Must-have: ${feature}`),
      ...unique(input.existingItems).map((item) => `Already owned: ${item}`),
      ...(input.pricePriority === 'performance' ? ['Performance requested; listing performance is not independently verified'] : []),
    ],
    questions,
    assumptions,
    editHistory: [],
  };
}

export function applyShoppingPlanEdit(state: ShoppingPlanState, message: string): ShoppingPlanInput {
  const edit = message.trim().slice(0, 500);
  const lower = edit.toLowerCase();
  const input: ShoppingPlanInput = {
    goal: state.goal,
    budget: state.budget,
    preferredBrands: [...state.preferences.preferredBrands],
    onlyPreferredBrands: state.preferences.onlyPreferredBrands,
    existingItems: [...state.existingItems],
    mustHaveFeatures: [...state.mustHaveFeatures],
    onlyVerifiedSellers: state.preferences.onlyVerifiedSellers,
    sellerRegionId: state.preferences.sellerRegion?.id,
    deliveryRegionId: state.preferences.requestedDeliveryRegion?.id,
    excludedTerms: [...state.preferences.excludedTerms],
    pricePriority: state.preferences.pricePriority,
    showAlternatives: state.preferences.showAlternatives,
  };

  const amount = explicitBudget(edit);
  if (amount !== undefined) input.budget = amount;

  const deliveryRequest = lower.match(/\b(?:sellers? (?:who )?deliver(?:y)? to|deliver(?:y)? to|available in)\s+(?:the\s+)?([a-z ]+?)(?:[.!?,]|$)/i);
  const requestedDeliveryRegion = deliveryRequest ? matchRegion(deliveryRequest[1]) : undefined;
  if (requestedDeliveryRegion) input.deliveryRegionId = requestedDeliveryRegion.id;

  const regionRequest = lower.match(/\b(?:only sellers? (?:based|located) in|sellers? (?:based|located) in)\s+(?:the\s+)?([a-z ]+?)(?:[.!?,]|$)/i);
  const requestedRegion = regionRequest ? matchRegion(regionRequest[1]) : undefined;
  if (requestedRegion) input.sellerRegionId = requestedRegion.id;

  if (/\b(only|just)\s+(?:(?:use|show)\s+)?verified\s+(?:agora\s+)?sellers?\b/i.test(edit)) {
    input.onlyVerifiedSellers = true;
  } else if (/\b(include|show)\s+all\s+sellers\b/i.test(edit)) {
    input.onlyVerifiedSellers = false;
  }

  if (/\b(cheaper|lower.cost|save money|less expensive|make it cheap)\b/i.test(lower)) {
    input.pricePriority = 'lower-cost';
  } else if (/\b(better performance|more powerful|higher performance|premium performance)\b/i.test(lower)) {
    input.pricePriority = 'performance';
  } else if (/\b(show|find|give me)\s+(?:some\s+)?alternatives?\b/i.test(lower)) {
    input.showAlternatives = true;
  }

  const brandMatch = edit.match(/\bonly\s+([A-Z][A-Za-z0-9-]{1,30})\b|\b(?:use|prefer)\s+([A-Z][A-Za-z0-9-]{1,30})\b/i);
  const brandName = brandMatch?.[1] || brandMatch?.[2];
  if (brandName && !/^(verified|products?|laptops?|notebooks?|sellers?|show|items?|devices?|gaming|all)$/i.test(brandName)) {
    input.preferredBrands = unique([...input.preferredBrands, brandName]);
    if (brandMatch?.[1]) input.onlyPreferredBrands = true;
  }
  if (/\b(include|show)\s+all\s+brands\b/i.test(edit)) {
    input.preferredBrands = [];
    input.onlyPreferredBrands = false;
  }

  const ownedMatch = edit.match(/\b(?:i already have|i own|already own)\s+(?:an?\s+)?(.+?)(?:[.!?,]|$)/i);
  const removalMatch = edit.match(/\bremove\s+(?:the\s+)?(.+?)(?:[.!?,]|$)/i);
  const excluded = ownedMatch?.[1] || removalMatch?.[1];
  if (excluded) {
    const term = excluded.trim();
    input.excludedTerms = unique([...(input.excludedTerms ?? []), term]);
    if (ownedMatch) input.existingItems = unique([...input.existingItems, term]);
  }
  const includeMatch = edit.match(/\b(?:include|show)\s+(?:the\s+)?(.+?)(?:[.!?,]|$)/i);
  if (includeMatch) {
    const term = includeMatch[1].trim().replace(/^all\s+/i, '');
    input.excludedTerms = (input.excludedTerms || []).filter((value) => value.toLowerCase() !== term.toLowerCase());
    input.existingItems = input.existingItems.filter((value) => value.toLowerCase() !== term.toLowerCase());
  }

  const featureMatch = edit.match(/\b(?:only products with|only (?:laptops?|notebooks?) with|must have|require|make it)\s+(.+?)(?:[.!?,]|$)/i);
  if (featureMatch && !/\b(cheaper|more powerful|lighter)\b/i.test(featureMatch[1])) {
    input.mustHaveFeatures = unique([...input.mustHaveFeatures, featureMatch[1]]);
  } else if (/\blighter\b/i.test(edit)) {
    input.mustHaveFeatures = unique([...input.mustHaveFeatures, 'lightweight']);
  }
  if (/\blaptop|notebook\b/i.test(edit) && /\b(only|replace|replacement)\b/i.test(edit)) {
    input.mustHaveFeatures = unique([...input.mustHaveFeatures, 'laptop']);
  }

  return input;
}

export function planEditHistory(state: ShoppingPlanState, message: string) {
  return [...state.editHistory, message.trim().slice(0, 500)].slice(-MAX_EDIT_HISTORY);
}

export function calculateSafeSelection(
  currentCandidates: SelectionPrice[],
  requestedIds: string[],
  maximumBudget?: number
): SafeSelection {
  const candidatePrices = new Map(currentCandidates.map(({ id, price }) => [id, price]));
  const uniqueIds = [...new Set(requestedIds)].slice(0, MAX_SELECTED_ITEMS);
  const validIds = uniqueIds.filter((id) => candidatePrices.has(id));
  const total = Number(validIds.reduce((sum, id) => sum + (candidatePrices.get(id) || 0), 0).toFixed(2));
  if (uniqueIds.length !== validIds.length) {
    return {
      productIds: validIds,
      total,
      notice: 'Some selected listings are no longer available in the refreshed catalog and were removed from the selection.',
    };
  }
  if (maximumBudget !== undefined && total > maximumBudget) {
    return {
      productIds: [],
      total: 0,
      notice: `Those selected items total GH₵${total.toLocaleString('en-GH')}, above your maximum of GH₵${maximumBudget.toLocaleString('en-GH')}. Your selection was cleared; adjust the selection or budget explicitly.`,
    };
  }
  return { productIds: validIds, total };
}

export function compatibilityStatus(): 'verified' | 'likely' | 'unknown' {
  return 'unknown';
}

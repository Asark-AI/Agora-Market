'use server';

import 'server-only';

import { getAdminDb } from '@/lib/firebase-admin';
import { requireSuperAdmin } from '@/lib/server/admin-auth';
import { writeAuditLog } from '@/lib/server/admin-audit';
import { buildGamingPcSolution, SolutionDefinitionSchema, type SolutionDefinition } from '@/lib/solutions';
import type { Product } from '@/lib/types';
import { z } from 'zod';

const DEFAULT_SOLUTIONS: SolutionDefinition[] = [buildGamingPcSolution()];

function normalizeSolutionRecord(input: Partial<SolutionDefinition> & { id?: string; slug?: string }, fallbackId?: string): SolutionDefinition {
  const base = typeof input === 'object' && input ? input : {};
  const slug = (base.slug || base.name || fallbackId || 'solution').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-');
  const normalizedRequirements = Array.isArray(base.requirements) ? base.requirements.map((requirement, index) => ({
    id: requirement?.id || `req-${index}`,
    name: requirement?.name || `Requirement ${index + 1}`,
    description: requirement?.description || 'Marketplace requirement.',
    type: requirement?.type || 'required',
    required: requirement?.required ?? true,
    minQuantity: Number(requirement?.minQuantity || requirement?.quantity || 1),
    maxQuantity: requirement?.maxQuantity === undefined ? undefined : Number(requirement.maxQuantity),
    quantity: Number(requirement?.quantity || requirement?.minQuantity || 1),
    keywords: Array.isArray(requirement?.keywords) ? requirement.keywords.map((keyword) => String(keyword)) : [],
    categoryIds: Array.isArray(requirement?.categoryIds) ? requirement.categoryIds.map((categoryId) => String(categoryId)) : [],
    notes: Array.isArray(requirement?.notes) ? requirement.notes.map((note) => String(note)) : [],
  })) : [];
  const metadata = base.metadata;
  const budgetRange = metadata?.budgetRange;

  return SolutionDefinitionSchema.parse({
    id: base.id || fallbackId || slug,
    slug,
    name: base.name || 'Untitled Solution',
    description: base.description || 'A goal-based shopping experience for the Agora marketplace.',
    category: base.category || 'General',
    status: base.status || 'draft',
    image: base.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    version: Number(base.version || 1),
    questions: Array.isArray(base.questions) && base.questions.length > 0 ? base.questions.map((question) => String(question)) : ['What is your budget?', 'What are you trying to achieve?'],
    budgetHint: typeof base.budgetHint === 'number' ? base.budgetHint : undefined,
    metadata: {
      targetAudience: typeof metadata?.targetAudience === 'string' ? metadata.targetAudience : '',
      useCases: Array.isArray(metadata?.useCases) ? metadata.useCases.map(String) : [],
      outcomes: Array.isArray(metadata?.outcomes) ? metadata.outcomes.map(String) : [],
      budgetRange: {
        currency: 'GHS',
        min: typeof budgetRange?.min === 'number' ? budgetRange.min : undefined,
        max: typeof budgetRange?.max === 'number' ? budgetRange.max : undefined,
      },
    },
    requirements: normalizedRequirements,
  });
}

export async function getPublicSolutionDefinitions(): Promise<SolutionDefinition[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('solutions').orderBy('updatedAt', 'desc').get();
    const records = snapshot.docs
      .map((doc) => normalizeSolutionRecord(doc.data() as Partial<SolutionDefinition>, doc.id))
      .filter((solution) => solution.status === 'active');
    if (records.length > 0) return records;
  } catch (error) {
    console.warn('Unable to load solution definitions from Firestore; falling back to defaults:', error);
  }

  return DEFAULT_SOLUTIONS;
}

export async function getPublicSolutionDefinitionBySlug(slug: string): Promise<SolutionDefinition | null> {
  const definitions = await getPublicSolutionDefinitions();
  return definitions.find((solution) => solution.slug === slug) || null;
}

function serializeFirestoreValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeFirestoreValue);
  if (value && typeof value === 'object') {
    const serializable = value as { toJSON?: () => unknown };
    if (typeof serializable.toJSON === 'function') {
      return serializeFirestoreValue(serializable.toJSON());
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, serializeFirestoreValue(entry)])
    );
  }
  return value;
}

export async function refreshPublicSolutionProducts(productRefs: { sellerId: string; productId: string }[]) {
  const refs = z.array(z.object({
    sellerId: z.string().trim().min(1).max(128),
    productId: z.string().trim().min(1).max(128),
  })).min(1).max(40).parse(productRefs);
  const uniqueRefs = [...new Map(refs.map((ref) => [JSON.stringify([ref.sellerId, ref.productId]), ref])).values()];
  const db = getAdminDb();
  const [sellerSnapshots, productSnapshots] = await Promise.all([
    Promise.all([...new Set(uniqueRefs.map(({ sellerId }) => sellerId))]
      .map((sellerId) => db.collection('sellers').doc(sellerId).get())),
    Promise.all(uniqueRefs.map(({ sellerId, productId }) =>
      db.collection('sellers').doc(sellerId).collection('products').doc(productId).get())),
  ]);
  const activeSellerIds = new Set(sellerSnapshots
    .filter((snapshot) => snapshot.exists && snapshot.data()?.status === 'active')
    .map((snapshot) => snapshot.id));
  const currentProducts = productSnapshots.flatMap((snapshot, index): Product[] => {
    const { sellerId } = uniqueRefs[index];
    const data = snapshot.data();
    if (
      !snapshot.exists
      || !activeSellerIds.has(sellerId)
      || data?.status !== 'active'
      || typeof data.stock !== 'number'
      || !Number.isSafeInteger(data.stock)
      || data.stock <= 0
    ) return [];
    return [{
      ...(serializeFirestoreValue(data) as Omit<Product, 'id' | 'sellerId'>),
      id: snapshot.id,
      sellerId,
    }];
  });
  if (currentProducts.length !== uniqueRefs.length) {
    throw new Error('Some selected listings have changed or are no longer available. Review your solution and try again.');
  }
  return currentProducts;
}

export async function getAdminSolutionDefinitions(): Promise<SolutionDefinition[]> {
  await requireSuperAdmin();
  const db = getAdminDb();

  try {
    const snapshot = await db.collection('solutions').orderBy('updatedAt', 'desc').get();
    return snapshot.docs.map((doc) => normalizeSolutionRecord(doc.data() as Partial<SolutionDefinition>, doc.id));
  } catch (error) {
    console.warn('Unable to load admin solution definitions:', error);
    return DEFAULT_SOLUTIONS;
  }
}

export async function saveSolutionDefinition(input: Partial<SolutionDefinition> & { id?: string; slug?: string; status?: 'draft' | 'active' | 'archived' }) {
  const admin = await requireSuperAdmin();
  const db = getAdminDb();
  const id = input.id || input.slug || `solution-${Date.now()}`;
  const normalized = normalizeSolutionRecord(input, id);
  const payload: Record<string, unknown> = {
    ...normalized,
    updatedAt: new Date(),
    editedBy: admin.uid,
  };

  if (!input.id) {
    payload.createdAt = new Date();
  }

  await db.collection('solutions').doc(id).set(payload, { merge: true });
  await writeAuditLog({
    admin,
    action: input.id ? 'UPDATE_SOLUTION_DEFINITION' : 'CREATE_SOLUTION_DEFINITION',
    targetType: 'solution-definition',
    targetId: id,
    reason: input.id ? 'Super Admin updated solution template' : 'Super Admin created solution template',
    success: true,
    metadata: { slug: normalized.slug, status: normalized.status, requirementCount: normalized.requirements.length },
  });

  return normalized;
}

export async function deleteSolutionDefinition(id: string) {
  const admin = await requireSuperAdmin();
  if (!id) throw new Error('A solution identifier is required.');
  const db = getAdminDb();
  await db.collection('solutions').doc(id).delete();
  await writeAuditLog({
    admin,
    action: 'DELETE_SOLUTION_DEFINITION',
    targetType: 'solution-definition',
    targetId: id,
    reason: 'Super Admin deleted solution template',
    success: true,
  });
}

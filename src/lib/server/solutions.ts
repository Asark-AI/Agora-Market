'use server';

import 'server-only';

import { getAdminDb } from '@/lib/firebase-admin';
import { requireSuperAdmin } from '@/lib/server/admin-auth';
import { buildGamingPcSolution, type SolutionDefinition } from '@/lib/solutions';

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
    maxQuantity: requirement?.maxQuantity ?? undefined,
    quantity: Number(requirement?.quantity || requirement?.minQuantity || 1),
    keywords: Array.isArray(requirement?.keywords) ? requirement.keywords.map((keyword) => String(keyword)) : [],
    categoryIds: Array.isArray(requirement?.categoryIds) ? requirement.categoryIds.map((categoryId) => String(categoryId)) : [],
    notes: Array.isArray(requirement?.notes) ? requirement.notes.map((note) => String(note)) : [],
  })) : [];
  const metadata = base.metadata;
  const budgetRange = metadata?.budgetRange;

  return {
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
  };
}

export async function getPublicSolutionDefinitions(): Promise<SolutionDefinition[]> {
  const db = getAdminDb();

  try {
    const snapshot = await db.collection('solutions').orderBy('updatedAt', 'desc').get();
    const records = snapshot.docs
      .map((doc) => normalizeSolutionRecord(doc.data() as Partial<SolutionDefinition>, doc.id))
      .filter((solution) => solution.status === 'active' || solution.status === 'draft');
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

  return normalized;
}

export async function deleteSolutionDefinition(id: string) {
  await requireSuperAdmin();
  if (!id) throw new Error('A solution identifier is required.');
  const db = getAdminDb();
  await db.collection('solutions').doc(id).delete();
}

import { z } from 'zod';
import type { Product } from '@/lib/types';

export type SolutionRequirementType = 'required' | 'optional' | 'conditional';
export type SolutionCompatibilityStatus = 'compatible' | 'incompatible' | 'unknown';

export type SolutionRequirement = {
  id: string;
  name: string;
  description: string;
  type: SolutionRequirementType;
  required: boolean;
  minQuantity: number;
  maxQuantity?: number;
  quantity: number;
  keywords: string[];
  categoryIds?: string[];
  notes?: string[];
};

export type SolutionMetadata = {
  targetAudience: string;
  useCases: string[];
  outcomes: string[];
  budgetRange?: {
    currency: 'GHS';
    min?: number;
    max?: number;
  };
};

export type SolutionDefinition = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  status: 'draft' | 'active' | 'archived';
  image: string;
  version: number;
  questions: string[];
  budgetHint?: number;
  metadata?: SolutionMetadata;
  requirements: SolutionRequirement[];
};

export const SolutionDefinitionSchema = z.object({
  id: z.string().trim().min(1).max(128),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  category: z.string().trim().min(1).max(80),
  status: z.enum(['draft', 'active', 'archived']),
  image: z.string().trim().max(2048),
  version: z.number().int().min(1).max(10_000),
  questions: z.array(z.string().trim().min(1).max(240)).max(20),
  budgetHint: z.number().finite().min(0).max(1_000_000).optional(),
  metadata: z.object({
    targetAudience: z.string().max(500),
    useCases: z.array(z.string().trim().min(1).max(120)).max(20),
    outcomes: z.array(z.string().trim().min(1).max(240)).max(20),
    budgetRange: z.object({
      currency: z.literal('GHS'),
      min: z.number().finite().min(0).max(1_000_000).optional(),
      max: z.number().finite().min(0).max(1_000_000).optional(),
    }),
  }),
  requirements: z.array(z.object({
    id: z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(500),
    type: z.enum(['required', 'optional', 'conditional']),
    required: z.boolean(),
    minQuantity: z.number().int().min(0).max(100),
    maxQuantity: z.number().int().min(1).max(100).optional(),
    quantity: z.number().int().min(0).max(100),
    keywords: z.array(z.string().trim().min(1).max(80)).max(30),
    categoryIds: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
    notes: z.array(z.string().trim().min(1).max(300)).max(20).optional(),
  })).min(1).max(40),
}).superRefine((solution, context) => {
  if (solution.metadata.budgetRange.min !== undefined && solution.metadata.budgetRange.max !== undefined
    && solution.metadata.budgetRange.min > solution.metadata.budgetRange.max) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['metadata', 'budgetRange'], message: 'Minimum budget cannot exceed maximum budget.' });
  }
  solution.requirements.forEach((requirement, index) => {
    if (requirement.quantity < requirement.minQuantity) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['requirements', index, 'quantity'], message: 'Suggested quantity must meet the minimum quantity.' });
    }
    if (requirement.maxQuantity !== undefined && (requirement.maxQuantity < requirement.minQuantity || requirement.quantity > requirement.maxQuantity)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['requirements', index, 'maxQuantity'], message: 'Maximum quantity must cover both minimum and suggested quantities.' });
    }
    if (requirement.required !== (requirement.type === 'required')) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['requirements', index, 'required'], message: 'The required flag must agree with the requirement type.' });
    }
  });
});

export type SolutionRecommendation = {
  requirementId: string;
  requirementName: string;
  quantity: number;
  matchingProducts: Product[];
  status: SolutionCompatibilityStatus;
  summary: string;
};

export type SolutionIntentSource = Pick<SolutionDefinition, 'slug' | 'name' | 'category'> & {
  metadata?: Pick<NonNullable<SolutionDefinition['metadata']>, 'useCases' | 'outcomes'>;
  requirements: Array<Pick<SolutionRequirement, 'name' | 'keywords'>>;
};

const normalizeWords = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

const getSpecValue = (product: Product | undefined, candidates: string[]) => {
  if (!product) return '';
  const normalized = new Map((product.specifications || []).map((spec) => [spec.name.trim().toLowerCase(), spec.value.trim()]));
  for (const candidate of candidates) {
    const value = normalized.get(candidate.toLowerCase());
    if (value) return value;
  }
  return '';
};

const matchesRequirement = (product: Product, requirement: SolutionRequirement) => {
  if (product.status !== 'active' || product.stock <= 0) return false;
  const description = typeof product.description === 'string'
    ? product.description
    : Object.values(product.description || {}).join(' ');
  const haystack = `${product.name} ${description} ${(product.specifications || []).map((spec) => `${spec.name} ${spec.value}`).join(' ')}`.toLowerCase();
  if (requirement.categoryIds?.length && !requirement.categoryIds.includes(product.categoryId)) {
    return false;
  }

  if (requirement.keywords.length === 0) {
    return true;
  }

  const normalizedKeywords = requirement.keywords.map((keyword) => keyword.toLowerCase());
  return normalizedKeywords.some((keyword) => haystack.includes(keyword));
};

export function buildGamingPcSolution(): SolutionDefinition {
  return {
    id: 'gaming-pc',
    slug: 'gaming-pc',
    name: 'Build a Gaming PC',
    description: 'Design a balanced gaming setup around your budget and usage profile using real products from the Agora marketplace.',
    category: 'Computing',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    version: 1,
    budgetHint: 10000,
    questions: [
      'What is your budget?',
      'Will you use the PC mostly for gaming, work, or both?',
      'Do you already own any peripherals or parts?',
    ],
    requirements: [
      {
        id: 'cpu',
        name: 'CPU',
        description: 'Primary processing unit for the gaming setup.',
        type: 'required',
        required: true,
        minQuantity: 1,
        quantity: 1,
        keywords: ['cpu', 'processor', 'amd ryzen', 'intel core'],
        categoryIds: ['electronics-hardware', 'electronics-laptops', 'electronics-computers'],
        notes: ['Choose a modern gaming CPU that matches the motherboard socket.'],
      },
      {
        id: 'motherboard',
        name: 'Motherboard',
        description: 'Mainboard that supports the selected CPU and memory.',
        type: 'required',
        required: true,
        minQuantity: 1,
        quantity: 1,
        keywords: ['motherboard'],
        categoryIds: ['electronics-hardware'],
        notes: ['Socket and memory support should align with the CPU and RAM.'],
      },
      {
        id: 'ram',
        name: 'RAM',
        description: 'Memory for gaming performance and multitasking.',
        type: 'required',
        required: true,
        minQuantity: 1,
        quantity: 2,
        keywords: ['ram', 'memory', 'ddr4', 'ddr5'],
        categoryIds: ['electronics-hardware'],
        notes: ['Check memory type against the motherboard specification.'],
      },
      {
        id: 'gpu',
        name: 'Graphics Card',
        description: 'Graphics processing unit for high-performance gaming.',
        type: 'required',
        required: true,
        minQuantity: 1,
        quantity: 1,
        keywords: ['graphics card', 'gpu', 'video card', 'nvidia', 'amd radeon'],
        categoryIds: ['electronics-hardware'],
        notes: ['Check GPU length and power requirements against the case and PSU.'],
      },
      {
        id: 'storage',
        name: 'Storage',
        description: 'Primary drive for the operating system and games.',
        type: 'required',
        required: true,
        minQuantity: 1,
        quantity: 1,
        keywords: ['ssd', 'hard drive', 'storage', 'nvme'],
        categoryIds: ['electronics-hardware'],
        notes: ['Use SSD storage for faster game loading and system responsiveness.'],
      },
      {
        id: 'psu',
        name: 'Power Supply',
        description: 'Power delivery for the full gaming chassis.',
        type: 'required',
        required: true,
        minQuantity: 1,
        quantity: 1,
        keywords: ['psu', 'power supply', 'power supply unit'],
        categoryIds: ['electronics-hardware'],
        notes: ['Ensure wattage is sufficient for the selected GPU and components.'],
      },
      {
        id: 'case',
        name: 'Case',
        description: 'Chassis for the full system build.',
        type: 'required',
        required: true,
        minQuantity: 1,
        quantity: 1,
        keywords: ['case', 'pc case', 'gaming case'],
        categoryIds: ['electronics-hardware'],
        notes: ['Check GPU clearance and motherboard form factor.'],
      },
      {
        id: 'monitor',
        name: 'Monitor',
        description: 'Display for the gaming setup.',
        type: 'optional',
        required: false,
        minQuantity: 0,
        quantity: 1,
        keywords: ['monitor', 'display', 'gaming monitor'],
        categoryIds: ['electronics-tv-audio', 'electronics-accessories'],
        notes: ['Optional, unless the buyer explicitly wants a full gaming bundle.'],
      },
    ],
  };
}

export function getSolutionCatalog(): SolutionDefinition[] {
  return [buildGamingPcSolution()];
}

export function findSolutionIntentMatches(goal: string, solutions: SolutionIntentSource[]) {
  const goalTokens = new Set(normalizeWords(goal).filter((word) => word.length > 2));
  if (!goalTokens.size) return [];
  return solutions.map((solution) => {
    const templateText = [
      solution.name,
      solution.category,
      ...(solution.metadata?.useCases || []),
      ...(solution.metadata?.outcomes || []),
      ...solution.requirements.flatMap((requirement) => [requirement.name, ...requirement.keywords]),
    ].join(' ');
    const templateTokens = new Set(normalizeWords(templateText).filter((word) => word.length > 2));
    const score = [...goalTokens].filter((word) => templateTokens.has(word)).length;
    return { solution, score };
  }).filter(({ score }) => score >= 2)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ solution }) => solution);
}

export function getSolutionBySlug(slug: string) {
  return getSolutionCatalog().find((solution) => solution.slug === slug);
}

export function getRequirementMatches(products: Product[], requirement: SolutionRequirement) {
  return products.filter((product) => matchesRequirement(product, requirement));
}

export function evaluateCompatibility(
  product: Product,
  requirementId: string,
  selectedProducts: Product[],
  selectedByRequirement: Record<string, Product | undefined> = {}
): SolutionCompatibilityStatus {
  if (!product) return 'unknown';
  const getRole = (...roles: string[]) => roles
    .map((role) => selectedByRequirement[role])
    .find((candidate) => candidate && candidate.id !== product.id)
    || selectedProducts.find((candidate) => candidate.id !== product.id && roles.some((role) => (
      candidate.name.toLowerCase().includes(role) || candidate.categoryId.toLowerCase().includes(role)
    )));
  const compareValues = (left: string, right: string) => {
    if (!left || !right) return 'unknown' as const;
    return left.trim().toLowerCase() === right.trim().toLowerCase() ? 'compatible' as const : 'incompatible' as const;
  };
  const socketKey = (value: string) => value.match(/\b(?:am\d+|lga\s*\d+|strx\d+)\b/i)?.[0].replace(/\s+/g, '').toLowerCase() || '';
  const lengthInMillimeters = (value: string) => {
    const match = value.match(/([\d.]+)\s*(mm|cm|in(?:ch(?:es)?)?)\b/i);
    if (!match) return Number.NaN;
    const amount = Number.parseFloat(match[1]);
    if (!Number.isFinite(amount)) return Number.NaN;
    const unit = match[2].toLowerCase();
    return unit === 'cm' ? amount * 10 : unit.startsWith('in') ? amount * 25.4 : amount;
  };
  const wattage = (value: string) => {
    const match = value.match(/([\d.]+)\s*(?:w|watt(?:s)?)\b/i);
    return match ? Number.parseFloat(match[1]) : Number.NaN;
  };
  const compareMemoryTypes = (ram: Product | undefined, motherboard: Product | undefined) => {
    const ramType = getSpecValue(ram, ['memory type', 'ram type', 'memory generation', 'ddr']);
    const boardType = getSpecValue(motherboard, ['memory type', 'supported memory', 'memory generation', 'ddr']);
    if (!ramType || !boardType) return 'unknown' as const;
    const ramGeneration = ramType.toLowerCase().match(/\bddr\s*([0-9]+)/)?.[1];
    const supportedGenerations = [...boardType.toLowerCase().matchAll(/\bddr\s*([0-9]+)/g)].map((match) => match[1]);
    if (!ramGeneration || !supportedGenerations.length) return 'unknown' as const;
    return supportedGenerations.includes(ramGeneration) ? 'compatible' as const : 'incompatible' as const;
  };

  if (requirementId === 'cpu' || requirementId === 'motherboard') {
    const cpu = requirementId === 'cpu' ? product : getRole('cpu', 'processor');
    const board = requirementId === 'motherboard' ? product : getRole('motherboard');
    const cpuSocket = socketKey(getSpecValue(cpu, ['socket', 'cpu socket', 'processor socket']));
    const boardSocket = socketKey(getSpecValue(board, ['socket', 'cpu socket', 'processor socket']));
    const socketStatus = compareValues(cpuSocket, boardSocket);
    if (socketStatus === 'incompatible') return socketStatus;
    if (socketStatus === 'compatible') return socketStatus;
    return 'unknown';
  }

  if (requirementId === 'ram') {
    const board = getRole('motherboard');
    return compareMemoryTypes(product, board);
  }

  if (requirementId === 'gpu' || requirementId === 'case') {
    const gpu = requirementId === 'gpu' ? product : getRole('gpu', 'graphics');
    const caseProduct = requirementId === 'case' ? product : getRole('case');
    const gpuLength = lengthInMillimeters(getSpecValue(gpu, ['length', 'gpu length', 'card length']));
    const caseClearance = lengthInMillimeters(getSpecValue(caseProduct, ['max gpu length', 'gpu clearance', 'maximum gpu length']));
    if (!Number.isFinite(gpuLength) || !Number.isFinite(caseClearance)) return 'unknown';
    return gpuLength <= caseClearance ? 'compatible' : 'incompatible';
  }

  if (requirementId === 'psu') {
    const powerSupply = product;
    const graphicsCard = getRole('gpu', 'graphics');
    const supplyWatts = wattage(getSpecValue(powerSupply, ['wattage', 'output wattage', 'output power']));
    const requiredWatts = wattage(getSpecValue(graphicsCard, ['recommended psu', 'recommended power supply']));
    if (!Number.isFinite(supplyWatts) || !Number.isFinite(requiredWatts)) return 'unknown';
    return supplyWatts >= requiredWatts ? 'compatible' : 'incompatible';
  }

  return 'unknown';
}

export function getSolutionRecommendations(products: Product[], solution: SolutionDefinition) {
  const recommendations: SolutionRecommendation[] = [];

  for (const requirement of solution.requirements) {
    const matches = getRequirementMatches(products, requirement);
    const selected = matches.slice(0, 8);
    recommendations.push({
      requirementId: requirement.id,
      requirementName: requirement.name,
      quantity: requirement.quantity,
      matchingProducts: selected,
      status: 'unknown',
      summary:
        selected.length > 0
          ? `${selected.length} listing${selected.length === 1 ? '' : 's'} match this requirement. Compatibility is not yet verified.`
          : 'No matching product is currently available in the catalog.',
    });
  }

  return recommendations;
}

export function getSolutionBudgetEstimate(recommendations: SolutionRecommendation[]) {
  return recommendations.reduce((total, recommendation) => {
    const bestProduct = recommendation.matchingProducts[0];
    const price = bestProduct && bestProduct.discountPrice != null && bestProduct.discountPrice < bestProduct.price
      ? bestProduct.discountPrice
      : bestProduct?.price || 0;
    return total + price * recommendation.quantity;
  }, 0);
}

export function getSolutionKeywords() {
  return normalizeWords('gaming pc cpu motherboard ram gpu storage monitor');
}

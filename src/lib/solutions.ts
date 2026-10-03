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

export type SolutionRecommendation = {
  requirementId: string;
  requirementName: string;
  matchingProducts: Product[];
  status: SolutionCompatibilityStatus;
  summary: string;
};

const normalizeWords = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

const getSpecValue = (product: Product, candidates: string[]) => {
  const normalized = new Map((product.specifications || []).map((spec) => [spec.name.trim().toLowerCase(), spec.value.trim()]));
  for (const candidate of candidates) {
    const value = normalized.get(candidate.toLowerCase());
    if (value) return value;
  }
  return '';
};

const matchesRequirement = (product: Product, requirement: SolutionRequirement) => {
  const haystack = `${product.name} ${product.description} ${(product.specifications || []).map((spec) => `${spec.name} ${spec.value}`).join(' ')}`.toLowerCase();
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

export function getSolutionBySlug(slug: string) {
  return getSolutionCatalog().find((solution) => solution.slug === slug);
}

export function getRequirementMatches(products: Product[], requirement: SolutionRequirement) {
  return products.filter((product) => matchesRequirement(product, requirement));
}

export function evaluateCompatibility(product: Product, requirementId: string, selectedProducts: Product[]): SolutionCompatibilityStatus {
  if (!product || !selectedProducts.length) {
    return 'unknown';
  }

  const specs = new Map((product.specifications || []).map((spec) => [spec.name.trim().toLowerCase(), spec.value.trim().toLowerCase()]));
  const cpuProduct = selectedProducts.find((candidate) => candidate.name.toLowerCase().includes('cpu') || candidate.name.toLowerCase().includes('processor'));
  const motherboardProduct = selectedProducts.find((candidate) => candidate.name.toLowerCase().includes('motherboard'));
  const ramProduct = selectedProducts.find((candidate) => candidate.name.toLowerCase().includes('ram') || candidate.name.toLowerCase().includes('memory'));

  if (requirementId === 'motherboard') {
    const cpuSocket = getSpecValue(cpuProduct || product, ['socket', 'cpu socket']);
    const motherboardSocket = getSpecValue(product, ['socket', 'cpu socket']);
    if (cpuSocket && motherboardSocket && cpuSocket.toLowerCase() !== motherboardSocket.toLowerCase()) {
      return 'incompatible';
    }
  }

  if (requirementId === 'ram') {
    const memoryType = getSpecValue(product, ['memory type', 'ddr', 'ram type']);
    const motherboardMemoryType = getSpecValue(motherboardProduct || product, ['memory type', 'supported memory', 'ddr']);
    if (memoryType && motherboardMemoryType) {
      const normalizedMemoryType = memoryType.toLowerCase();
      const normalizedMotherboardType = motherboardMemoryType.toLowerCase();
      if (!normalizedMotherboardType.includes(normalizedMemoryType) && !normalizedMemoryType.includes(normalizedMotherboardType)) {
        return 'incompatible';
      }
    }
  }

  if (requirementId === 'psu') {
    const psuWattage = Number.parseInt(getSpecValue(product, ['wattage', 'power', 'output power']) || '0', 10);
    const gpuPower = Number.parseInt(getSpecValue(selectedProducts.find((candidate) => candidate.name.toLowerCase().includes('graphics') || candidate.name.toLowerCase().includes('gpu')) || product, ['power draw', 'wattage', 'recommended psu']) || '0', 10);
    if (psuWattage && gpuPower && psuWattage < gpuPower) {
      return 'incompatible';
    }
  }

  if (requirementId === 'case') {
    const gpuLength = Number.parseFloat(getSpecValue(selectedProducts.find((candidate) => candidate.name.toLowerCase().includes('graphics') || candidate.name.toLowerCase().includes('gpu')) || product, ['length', 'gpu length']) || '0');
    const caseMaxGpuLength = Number.parseFloat(getSpecValue(product, ['max gpu length', 'gpu clearance', 'maximum gpu length']) || '0');
    if (gpuLength && caseMaxGpuLength && gpuLength > caseMaxGpuLength) {
      return 'incompatible';
    }
  }

  if (specs.size > 0) {
    return 'compatible';
  }

  return 'unknown';
}

export function getSolutionRecommendations(products: Product[], solution: SolutionDefinition) {
  const recommendations: SolutionRecommendation[] = [];

  for (const requirement of solution.requirements) {
    const matches = getRequirementMatches(products, requirement);
    const selected = matches.slice(0, 3);

    const status = selected.length > 0 ? 'compatible' : 'unknown';
    recommendations.push({
      requirementId: requirement.id,
      requirementName: requirement.name,
      matchingProducts: selected,
      status,
      summary:
        selected.length > 0
          ? `${selected.length} product${selected.length === 1 ? '' : 's'} match this requirement.`
          : 'No matching product is currently available in the catalog.',
    });
  }

  return recommendations;
}

export function getSolutionBudgetEstimate(recommendations: SolutionRecommendation[]) {
  return recommendations.reduce((total, recommendation) => {
    const bestProduct = recommendation.matchingProducts[0];
    return total + (bestProduct ? bestProduct.price : 0);
  }, 0);
}

export function getSolutionKeywords() {
  return normalizeWords('gaming pc cpu motherboard ram gpu storage monitor');
}

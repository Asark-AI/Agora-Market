import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildGamingPcSolution,
  evaluateCompatibility,
  findSolutionIntentMatches,
  getRequirementMatches,
  getSolutionBudgetEstimate,
  getSolutionRecommendations,
  SolutionDefinitionSchema,
} from '../src/lib/solutions.ts';
import type { Product } from '../src/lib/types.ts';

function product(input: {
  id: string;
  name: string;
  price?: number;
  discountPrice?: number;
  stock?: number;
  status?: Product['status'];
  categoryId?: string;
  specifications?: Array<{ name: string; value: string }>;
}): Product {
  return {
    id: input.id,
    name: input.name,
    description: 'Marketplace listing',
    price: input.price ?? 100,
    discountPrice: input.discountPrice,
    images: [],
    videos: [],
    categoryId: input.categoryId ?? 'electronics-hardware',
    sellerId: 'seller-1',
    userId: 'user-1',
    regionId: 'greater-accra',
    stock: input.stock ?? 5,
    status: input.status ?? 'active',
    views: 0,
    favorites: 0,
    specifications: input.specifications,
  };
}

test('solution requirement results contain only active, in-stock listings', () => {
  const template = buildGamingPcSolution();
  const cpuRequirement = template.requirements.find((requirement) => requirement.id === 'cpu');
  assert.ok(cpuRequirement);
  const matches = getRequirementMatches([
    product({ id: 'available', name: 'AMD Ryzen CPU' }),
    product({ id: 'empty', name: 'Intel CPU', stock: 0 }),
    product({ id: 'inactive', name: 'AMD Processor', status: 'inactive' }),
  ], cpuRequirement);
  assert.deepEqual(matches.map(({ id }) => id), ['available']);
});

test('CPU and motherboard compatibility requires matching documented socket values', () => {
  const cpu = product({ id: 'cpu', name: 'Processor', specifications: [{ name: 'Socket', value: 'AM5' }] });
  const matchingBoard = product({ id: 'board', name: 'Motherboard', specifications: [{ name: 'CPU Socket', value: 'AM5' }] });
  const differentBoard = product({ id: 'other-board', name: 'Motherboard', specifications: [{ name: 'CPU Socket', value: 'LGA1700' }] });
  assert.equal(evaluateCompatibility(cpu, 'cpu', [cpu, matchingBoard], { cpu, motherboard: matchingBoard }), 'compatible');
  assert.equal(evaluateCompatibility(cpu, 'cpu', [cpu, differentBoard], { cpu, motherboard: differentBoard }), 'incompatible');
  assert.equal(evaluateCompatibility(cpu, 'cpu', [cpu], { cpu }), 'unknown');
});

test('RAM compatibility uses explicit DDR generations and GPU clearance stays unknown without measurements', () => {
  const ram = product({ id: 'ram', name: 'Memory', specifications: [{ name: 'Memory type', value: 'DDR5' }] });
  const ddr5Board = product({ id: 'board', name: 'Motherboard', specifications: [{ name: 'Supported memory', value: 'DDR4, DDR5' }] });
  const gpu = product({ id: 'gpu', name: 'Graphics card' });
  const pcCase = product({ id: 'case', name: 'PC case' });
  assert.equal(evaluateCompatibility(ram, 'ram', [ram, ddr5Board], { ram, motherboard: ddr5Board }), 'compatible');
  assert.equal(evaluateCompatibility(gpu, 'gpu', [gpu, pcCase], { gpu, case: pcCase }), 'unknown');
});

test('recommendations do not claim compatibility based only on a text match', () => {
  const template = buildGamingPcSolution();
  const products = [product({ id: 'board', name: 'Gaming motherboard', specifications: [{ name: 'Chipset', value: 'Example' }] })];
  const recommendation = getSolutionRecommendations(products, template).find(({ requirementId }) => requirementId === 'motherboard');
  assert.equal(recommendation?.status, 'unknown');
  assert.match(recommendation?.summary || '', /not yet verified/);
});

test('solution estimates use discounted listing prices and requested quantities', () => {
  const template = buildGamingPcSolution();
  const monitor = product({ id: 'monitor', name: 'Gaming monitor', price: 500, discountPrice: 350, categoryId: 'electronics-tv-audio' });
  const recommendation = getSolutionRecommendations([monitor], template).find(({ requirementId }) => requirementId === 'monitor');
  assert.ok(recommendation);
  assert.equal(getSolutionBudgetEstimate([{ ...recommendation, quantity: 2 }]), 700);
});

test('solution schema rejects invalid quantity ranges and inconsistent required flags', () => {
  const solution = buildGamingPcSolution();
  const invalid = {
    ...solution,
    requirements: solution.requirements.map((requirement) => requirement.id === 'cpu'
      ? { ...requirement, minQuantity: 2, quantity: 1 }
      : requirement),
  };
  assert.equal(SolutionDefinitionSchema.safeParse(invalid).success, false);
});

test('goal matching suggests relevant active solution templates without sending inventory to a model', () => {
  const matches = findSolutionIntentMatches('Help me build a gaming PC', [buildGamingPcSolution()]);
  assert.deepEqual(matches.map(({ slug }) => slug), ['gaming-pc']);
  assert.deepEqual(findSolutionIntentMatches('Find a phone charger', [buildGamingPcSolution()]), []);
});

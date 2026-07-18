
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const EstimateManufacturingCostInputSchema = z.object({
  productName: z.string().describe('The name or type of product to be manufactured.'),
  quantity: z.coerce.number().int().positive().describe('The number of units to be produced.'),
  specifications: z.string().describe('A brief description of the materials, size, and complexity.'),
});

export type EstimateManufacturingCostInput = z.infer<typeof EstimateManufacturingCostInputSchema>;

const EstimateManufacturingCostOutputSchema = z.object({
  estimatedCost: z.number().describe('A rough, non-binding estimated cost for the manufacturing job.'),
  currency: z.string().default('GHS').describe('The currency of the estimated cost.'),
  disclaimer: z.string().describe('A disclaimer that this is a rough estimate and not a final quote.'),
});

export type EstimateManufacturingCostOutput = z.infer<typeof EstimateManufacturingCostOutputSchema>;

export async function estimateManufacturingCost(input: EstimateManufacturingCostInput): Promise<EstimateManufacturingCostOutput> {
  return estimateManufacturingCostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateManufacturingCostPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: EstimateManufacturingCostInputSchema },
  output: { schema: EstimateManufacturingCostOutputSchema },
  prompt: `You are an expert in Ghanaian manufacturing and production cost estimation.
Based on the following user request, provide a rough, non-binding cost estimate in Ghanaian Cedis (GHS).

Product: {{{productName}}}
Quantity: {{{quantity}}}
Specifications: {{{specifications}}}

Your estimate should be a reasonable ballpark figure. It is not a final quote.
Include a disclaimer stating that this is an estimate and the final price may vary based on a detailed quote from the manufacturer.
`,
});

const estimateManufacturingCostFlow = ai.defineFlow(
  {
    name: 'estimateManufacturingCostFlow',
    inputSchema: EstimateManufacturingCostInputSchema,
    outputSchema: EstimateManufacturingCostOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);


'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateProductDescriptionInputSchema = z.object({
    shortDescription: z.string().describe('A brief, catchy title or phrase for the product.').optional(),
    keywords: z.string().describe('Comma-separated keywords that highlight the product\'s features, materials, or target audience.').optional(),
    photoDataUri: z
    .string()
    .describe(
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ).optional(),
});
export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

const GenerateProductDescriptionOutputSchema = z.object({
    englishDescription: z.string().describe('A compelling and detailed product description in English.'),
});
export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;

export async function generateProductDescription(input: GenerateProductDescriptionInput): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: GenerateProductDescriptionInputSchema },
  output: { schema: GenerateProductDescriptionOutputSchema },
  prompt: `You are an expert e-commerce copywriter. Your task is to generate a compelling, detailed product description in English.

{{#if photoDataUri}}
Use the following image as the primary source of information.
Photo: {{media url=photoDataUri}}
{{/if}}
{{#if shortDescription}}
Use the following short description and keywords as the primary source of information.
Short Description: {{{shortDescription}}}
Keywords: {{{keywords}}}
{{/if}}

Write an engaging and persuasive description. It should be at least 2 paragraphs long and highlight the key benefits and features based on the provided inputs.
`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI model failed to generate a valid description. This might be a temporary issue. Please try again.");
    }
    return output;
  }
);

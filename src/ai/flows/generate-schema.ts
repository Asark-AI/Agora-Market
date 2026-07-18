
'use server';
/**
 * @fileoverview A Genkit flow for generating a Zod schema from a text description.
 *
 * This file defines a Genkit flow that takes a natural language description of a data structure
 * and uses an AI model to generate a corresponding Zod schema. This is useful for dynamically
Tada creating data validation schemas based on user input or other dynamic requirements.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateSchemaInputSchema = z.object({
  description: z
    .string()
    .describe('A natural language description of the desired data structure.'),
});
export type GenerateSchemaInput = z.infer<typeof GenerateSchemaInputSchema>;

const GenerateSchemaOutputSchema = z.object({
  schema: z
    .string()
    .describe(
      'The generated Zod schema as a TypeScript string. This string should be directly usable in a TypeScript file.'
    ),
});
export type GenerateSchemaOutput = z.infer<typeof GenerateSchemaOutputSchema>;

export async function generateSchema(
  input: GenerateSchemaInput
): Promise<GenerateSchemaOutput> {
  return generateSchemaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSchemaPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: GenerateSchemaInputSchema},
  output: {schema: GenerateSchemaOutputSchema},
  prompt: `You are an expert at generating Zod schemas for TypeScript.
  Given the following description, generate a Zod schema.
  The response should be a single string of valid TypeScript code that can be directly used.
  Description: {{{description}}}`,
});

const generateSchemaFlow = ai.defineFlow(
  {
    name: 'generateSchemaFlow',
    inputSchema: GenerateSchemaInputSchema,
    outputSchema: GenerateSchemaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

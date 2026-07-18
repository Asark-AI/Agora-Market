
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateNdaInputSchema = z.object({
  disclosingParty: z.string().describe("The name of the party disclosing information (e.g., the buyer)."),
  receivingParty: z.string().describe("The name of the party receiving information (e.g., the manufacturer)."),
  projectName: z.string().describe("The name or description of the project or product."),
});

export type GenerateNdaInput = z.infer<typeof GenerateNdaInputSchema>;

const GenerateNdaOutputSchema = z.object({
  ndaText: z.string().describe("The full text of the Non-Disclosure Agreement in Markdown format."),
});

export type GenerateNdaOutput = z.infer<typeof GenerateNdaOutputSchema>;

export async function generateNda(input: GenerateNdaInput): Promise<GenerateNdaOutput> {
  return generateNdaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNdaPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: GenerateNdaInputSchema },
  output: { schema: GenerateNdaOutputSchema },
  prompt: `You are a legal assistant specializing in commercial agreements in Ghana.
Generate a simple, standard, one-way Non-Disclosure Agreement (NDA) based on Ghanaian law.

The agreement is to protect the intellectual property of the Disclosing Party.

- Disclosing Party: {{{disclosingParty}}}
- Receiving Party: {{{receivingParty}}}
- Purpose of Disclosure: Evaluation for the manufacturing of "{{{projectName}}}"

The generated NDA text should be in Markdown format and include sections for:
1.  Definition of Confidential Information
2.  Obligations of the Receiving Party
3.  Exclusions from Confidential Information
4.  Term and Termination
5.  Governing Law (which should be the laws of Ghana)
6.  Signatures

Keep the language clear and straightforward. This is for preliminary discussions and should not be overly complex.
`,
});

const generateNdaFlow = ai.defineFlow(
  {
    name: 'generateNdaFlow',
    inputSchema: GenerateNdaInputSchema,
    outputSchema: GenerateNdaOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

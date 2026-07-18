
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GetSuggestedQuestionsInputSchema = z.object({
  productName: z.string().describe('The name or type of product the buyer is asking about.'),
});

export type GetSuggestedQuestionsInput = z.infer<typeof GetSuggestedQuestionsInputSchema>;

const GetSuggestedQuestionsOutputSchema = z.object({
  questions: z.array(z.string()).describe('An array of 3-4 suggested questions a buyer might ask a manufacturer.'),
});

export type GetSuggestedQuestionsOutput = z.infer<typeof GetSuggestedQuestionsOutputSchema>;

export async function getSuggestedQuestions(input: GetSuggestedQuestionsInput): Promise<GetSuggestedQuestionsOutput> {
  return getSuggestedQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getSuggestedQuestionsPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: GetSuggestedQuestionsInputSchema },
  output: { schema: GetSuggestedQuestionsOutputSchema },
  prompt: `You are a procurement expert for manufacturing in Ghana.
A buyer is about to contact a manufacturer about producing the following product: {{{productName}}}.

Generate a list of 3-4 essential questions the buyer should ask the manufacturer.
The questions should be relevant to a B2B manufacturing context.

Examples of good questions:
- What is your Minimum Order Quantity (MOQ)?
- Can you provide a sample before mass production?
- What are your payment terms for bulk orders?
- What is the estimated lead time for production and shipping?
- Do you have experience exporting to [Country]?
- What quality control measures do you have in place?
`,
});

const getSuggestedQuestionsFlow = ai.defineFlow(
  {
    name: 'getSuggestedQuestionsFlow',
    inputSchema: GetSuggestedQuestionsInputSchema,
    outputSchema: GetSuggestedQuestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

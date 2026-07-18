
'use server';
/**
 * @fileOverview A store assistant AI agent for answering customer questions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const FaqSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

export const GenerateChatResponseInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history so far.'),
  question: z.string().describe('The latest question from the user.'),
  instructions: z
    .string()
    .describe('The general instructions for how the AI should behave.'),
  faqs: z.array(FaqSchema).describe('A list of FAQs to help answer questions.'),
  shippingPolicy: z.string().optional().describe("The store's shipping policy."),
  returnPolicy: z.string().optional().describe("The store's return policy."),
});
export type GenerateChatResponseInput = z.infer<
  typeof GenerateChatResponseInputSchema
>;

export const GenerateChatResponseOutputSchema = z.object({
  answer: z
    .string()
    .describe('The generated answer to the user\'s question.'),
});
export type GenerateChatResponseOutput = z.infer<
  typeof GenerateChatResponseOutputSchema
>;

export async function generateChatResponse(
  input: GenerateChatResponseInput
): Promise<GenerateChatResponseOutput> {
  return generateChatResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChatResponsePrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: GenerateChatResponseInputSchema },
  output: { schema: GenerateChatResponseOutputSchema },
  prompt: `You are an AI assistant for an online store. Your goal is to answer customer questions based on the information provided.

Role and Personality:
{{{instructions}}}

Conversation History (for context):
{{#each history}}
- {{role}}: {{{content}}}
{{/each}}

Here is a list of Frequently Asked Questions, the Shipping Policy, and the Return Policy. Use them as the primary source of truth to answer questions. Do not make up information if the answer is not in these documents. If you don't know the answer, say "I'm sorry, I don't have information about that. Please contact the seller directly."

Shipping Policy:
{{{shippingPolicy}}}

Return Policy:
{{{returnPolicy}}}

FAQs:
{{#each faqs}}
Q: {{{question}}}
A: {{{answer}}}
{{/each}}

---

Latest User Question:
"{{{question}}}"

Based on all the above, provide a helpful and concise answer to the latest user question.`,
});

const generateChatResponseFlow = ai.defineFlow(
  {
    name: 'generateChatResponseFlow',
    inputSchema: GenerateChatResponseInputSchema,
    outputSchema: GenerateChatResponseOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

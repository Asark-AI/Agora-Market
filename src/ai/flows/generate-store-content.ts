
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ContentTypeSchema = z.enum([
    "about-us", 
    "shipping-policy", 
    "return-policy",
    "seo-title",
    "seo-description"
]);

const GenerateStoreContentInputSchema = z.object({
  contentType: ContentTypeSchema.describe("The type of content to generate."),
  storeName: z.string().describe("The name of the store."),
  storeBio: z.string().describe("A short bio or description of the store and its products."),
  storeCategories: z.array(z.string()).describe("The categories of products the store sells."),
});

export type GenerateStoreContentInput = z.infer<typeof GenerateStoreContentInputSchema>;

const GenerateStoreContentOutputSchema = z.object({
  generatedText: z.string().describe("The generated text content."),
});

export type GenerateStoreContentOutput = z.infer<typeof GenerateStoreContentOutputSchema>;

export async function generateStoreContent(input: GenerateStoreContentInput): Promise<GenerateStoreContentOutput> {
  return generateStoreContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStoreContentPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: GenerateStoreContentInputSchema },
  output: { schema: GenerateStoreContentOutputSchema },
  prompt: `You are an expert e-commerce consultant and copywriter.
Your task is to generate content for a seller's storefront based on the requested content type.

Store Name: {{{storeName}}}
Store Bio: {{{storeBio}}}
Store Categories: {{#each storeCategories}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Content to Generate: {{{contentType}}}

Instructions:
- **about-us**: Write a warm and engaging "About Us" section. Tell a brief story about the brand. Mention the types of products sold.
- **shipping-policy**: Write a standard shipping policy for a small business based in Ghana. Mention processing times (1-2 business days) and estimated delivery times (2-5 business days locally). State that international shipping costs will be calculated at checkout.
- **return-policy**: Write a simple return policy. Allow returns within 7 days for defective items. State that the item must be unused and in its original packaging. Buyer pays for return shipping.
- **seo-title**: Generate a concise and effective SEO title tag (under 60 characters). It should include the store name and key product categories.
- **seo-description**: Generate a compelling SEO meta description (under 160 characters). It should summarize the store's offerings and entice users to click.
`,
});

const generateStoreContentFlow = ai.defineFlow(
  {
    name: 'generateStoreContentFlow',
    inputSchema: GenerateStoreContentInputSchema,
    outputSchema: GenerateStoreContentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

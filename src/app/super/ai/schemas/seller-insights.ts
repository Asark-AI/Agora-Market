
import { z } from 'zod';

// Define the input schema based on a subset of the Seller type.
// This is the data the AI flow needs for its analysis.
export const SellerDataInputSchema = z.array(z.object({
    name: z.string(),
    revenue: z.number(),
    status: z.string(),
    joined: z.string(),
    plan: z.string(), // Added plan to the schema
}));

export type SellerDataInput = z.infer<typeof SellerDataInputSchema>;


// Define the schema for a single insight that the AI will generate.
export const InsightSchema = z.object({
    title: z.string().describe('A short, catchy title for the insight. Max 10 words.'),
    description: z.string().describe('A concise explanation of the insight. What happened and why is it important? Max 25 words.'),
    type: z.enum(['positive', 'negative', 'neutral']).describe("The sentiment of the insight. 'positive' for growth, 'negative' for decline/risk, 'neutral' for observations."),
});

export type Insight = z.infer<typeof InsightSchema>;


// Define the overall output schema for the flow, which is a list of insights.
export const InsightsOutputSchema = z.object({
    insights: z.array(InsightSchema).describe('A list of 2-3 key insights discovered from the data.'),
});

export type InsightsOutput = z.infer<typeof InsightsOutputSchema>;


'use server';
/**
 * @fileOverview An AI flow to generate business insights from seller analytics data.
 *
 * - generateAnalyticsInsights: Analyzes seller data to find trends and anomalies.
 */

import { ai } from '@/app/super/ai/genkit';
import type { Seller } from '@/app/super/services/sellers';
import {
  SellerDataInputSchema,
  InsightsOutputSchema,
  type Insight,
} from '@/app/super/ai/schemas/seller-insights';
import { z } from 'zod';

const FlowInputSchema = z.object({
    jsonData: z.string(),
});

/**
 * A wrapper function that calls the Genkit flow to generate insights.
 * @param input An array of seller data.
 * @returns A promise that resolves to an array of Insight objects.
 */
export async function generateAnalyticsInsights(input: Seller[]): Promise<Insight[]> {
    // We map the full Seller object to the schema the AI needs.
    const mappedInput = input.map(seller => ({
        name: seller.name,
        revenue: seller.revenue,
        status: seller.status,
        joined: seller.joined,
        plan: seller.plan, // Add the plan for tier comparison
    }));
    
    const result = await analyticsInsightsFlow({ jsonData: JSON.stringify(mappedInput, null, 2) });
    return result.insights;
}


const prompt = ai.definePrompt({
  name: 'analyticsInsightPrompt',
  input: { schema: FlowInputSchema },
  output: { schema: InsightsOutputSchema },
  prompt: `You are a senior business analyst for an e-commerce platform in Ghana.
You have been given a raw JSON dataset of seller performance.
Your task is to analyze this data and identify 2-3 of the most critical insights.

Focus on:
- **Seller Tier Comparison**: Compare the performance (e.g., average revenue) of 'Premium' sellers versus 'Basic'/'Free' sellers. Is there a notable difference?
- **Risk Alerts**: Identify any active sellers whose revenue seems unusually low or has potentially dropped. Also, flag any high-revenue sellers who are 'Suspended' or 'Pending'.
- **Growth Anomalies**: Pinpoint any sellers with unusually high revenue, especially if they are on a 'Basic' or 'Free' plan, as they might be good candidates for an upgrade.

For each insight, provide a short title and a concise, actionable description. Classify the insight as 'positive', 'negative', or 'neutral'.

Analyze the following seller data:
\`\`\`json
{{{jsonData}}}
\`\`\`
`,
});

const analyticsInsightsFlow = ai.defineFlow(
  {
    name: 'analyticsInsightsFlow',
    inputSchema: FlowInputSchema,
    outputSchema: InsightsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      return { insights: [] };
    }
    return output;
  }
);

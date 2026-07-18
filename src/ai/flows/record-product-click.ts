
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, getDoc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const RecordProductClickInputSchema = z.object({
  sellerId: z.string().describe('The document ID of the seller.'),
  itemId: z.string().describe('The document ID of the product or service.'),
  itemType: z.enum(['product', 'service']).describe('The type of item being clicked.'),
  userId: z.string().describe('The ID of the user who clicked.'),
});

export type RecordProductClickInput = z.infer<typeof RecordProductClickInputSchema>;

const RecordProductClickOutputSchema = z.object({
  success: z.boolean(),
});

export type RecordProductClickOutput = z.infer<typeof RecordProductClickOutputSchema>;

export async function recordProductClick(input: RecordProductClickInput): Promise<RecordProductClickOutput> {
  return recordProductClickFlow(input);
}

const recordProductClickFlow = ai.defineFlow(
  {
    name: 'recordProductClickFlow',
    inputSchema: RecordProductClickInputSchema,
    outputSchema: RecordProductClickOutputSchema,
  },
  async (input) => {
    try {
      if (!db) {
        return { success: false };
      }

      const { sellerId, itemId, itemType, userId } = input;
      const collectionName = itemType === 'service' ? 'services' : 'products';
      const itemRef = doc(db, 'sellers', sellerId, collectionName, itemId);

      const docSnap = await getDoc(itemRef);

      if (!docSnap.exists()) {
          console.error(`Item with ID ${itemId} not found for seller ${sellerId}.`);
          return { success: false };
      }

      await updateDoc(itemRef, {
        clicks: increment(1),
        clickHistory: arrayUnion({
          userId: userId,
          timestamp: new Date().toISOString(),
        }),
      });

      return { success: true };
    } catch (error) {
      console.error('Error recording product click:', error);
      return { success: false };
    }
  }
);

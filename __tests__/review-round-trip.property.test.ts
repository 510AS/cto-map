/**
 * Property-based test for weekly review round-trip.
 *
 * Feature: cto-learning-helper, Property 18: Weekly Review Round-Trip
 *
 * **Validates: Requirements 10.3**
 *
 * For any response text R saved for prompt P of week W, subsequently loading
 * week W's review SHALL return R for prompt P.
 */

import * as fc from 'fast-check';
import { prisma } from '../lib/prisma';

const VALID_PROMPTS = ['learned', 'built', 'difficult', 'differently'] as const;

describe('Property 18: Weekly Review Round-Trip', () => {
  let testWeekId: number;

  beforeAll(async () => {
    let week = await prisma.week.findFirst();
    if (!week) {
      // Create a test week if none exists
      const phase = await prisma.phase.upsert({
        where: { name: 'Review Round-Trip Test Phase' },
        update: {},
        create: { name: 'Review Round-Trip Test Phase', badge: '📝', sortOrder: 8002 },
      });
      week = await prisma.week.create({
        data: {
          weekNumber: 8002,
          title: 'Review Round-Trip Test Week',
          goal: 'Test goal',
          saasEvolution: 'Test evolution',
          phaseId: phase.id,
        },
      });
    }
    testWeekId = week.id;
  });

  afterAll(async () => {
    // Clean up test review responses
    await prisma.reviewResponse.deleteMany({
      where: { weekId: testWeekId },
    });
    await prisma.$disconnect();
  });

  /**
   * **Validates: Requirements 10.3**
   *
   * For any non-empty response text and any of the four prompts,
   * upserting a review response and then reading it back should
   * return the exact same response text.
   */
  it('should persist and retrieve arbitrary review responses for any prompt', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.constantFrom(...VALID_PROMPTS),
        async (responseText, prompt) => {
          // Upsert the review response
          await prisma.reviewResponse.upsert({
            where: {
              weekId_prompt: { weekId: testWeekId, prompt },
            },
            update: { response: responseText },
            create: {
              weekId: testWeekId,
              prompt,
              response: responseText,
            },
          });

          // Read it back
          const retrieved = await prisma.reviewResponse.findUnique({
            where: {
              weekId_prompt: { weekId: testWeekId, prompt },
            },
          });

          // Assert equality
          expect(retrieved).not.toBeNull();
          expect(retrieved!.response).toBe(responseText);
          expect(retrieved!.prompt).toBe(prompt);
          expect(retrieved!.weekId).toBe(testWeekId);
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);
});

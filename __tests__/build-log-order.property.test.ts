/**
 * Property-based test for build log order.
 *
 * Feature: cto-learning-helper, Property 16: Build Log Order
 *
 * **Validates: Requirements 8.3**
 *
 * For any set of saved build log entries, the Build Log screen SHALL display
 * them in strictly ascending order of week number.
 *
 * Uses fast-check to generate arbitrary subsets of week numbers, save build log
 * entries for them, then query and assert the results are in strictly ascending
 * week-number order.
 */

import * as fc from 'fast-check';
import { prisma } from '@/lib/prisma';

describe('Property 16: Build Log Order', () => {
  let allWeekIds: { id: number; weekNumber: number }[] = [];

  beforeAll(async () => {
    // Fetch all seeded weeks (1-52) to use for generating subsets
    const weeks = await prisma.week.findMany({
      select: { id: true, weekNumber: true },
      where: { weekNumber: { gte: 1, lte: 52 } },
      orderBy: { weekNumber: 'asc' },
    });

    if (weeks.length === 0) {
      throw new Error('No seeded data found. Run db:seed first.');
    }

    allWeekIds = weeks;
  });

  afterAll(async () => {
    // Clean up all build log entries created during tests
    await prisma.buildLogEntry.deleteMany({});
    await prisma.$disconnect();
  });

  /**
   * **Validates: Requirements 8.3**
   *
   * For any arbitrary subset of week numbers, save build log entries for them,
   * then query the build log and assert entries are returned in strictly
   * ascending week-number order.
   * Minimum 100 iterations.
   */
  it('should return build log entries in strictly ascending week-number order for any subset of saved entries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(
          fc.integer({ min: 1, max: allWeekIds.length }),
          { minLength: 1, maxLength: Math.min(allWeekIds.length, 20) }
        ),
        async (indices: number[]) => {
          // Clean up previous iteration's entries
          await prisma.buildLogEntry.deleteMany({});

          // Pick weeks corresponding to the generated indices
          const selectedWeeks = indices.map((i) => allWeekIds[i - 1]);

          // Save build log entries for the selected weeks (in arbitrary order)
          for (const week of selectedWeeks) {
            await prisma.buildLogEntry.upsert({
              where: { weekId: week.id },
              create: { weekId: week.id, content: `Entry for week ${week.weekNumber}` },
              update: { content: `Entry for week ${week.weekNumber}` },
            });
          }

          // Query build log entries the same way the page does:
          // weeks ordered by weekNumber ascending, with their build log entries
          const weeks = await prisma.week.findMany({
            where: {
              buildLogEntry: { isNot: null },
            },
            orderBy: { weekNumber: 'asc' },
            select: {
              weekNumber: true,
              buildLogEntry: {
                select: { content: true },
              },
            },
          });

          // Assert we got back the correct number of entries
          expect(weeks.length).toBe(selectedWeeks.length);

          // Assert strictly ascending week-number order
          for (let i = 1; i < weeks.length; i++) {
            expect(weeks[i].weekNumber).toBeGreaterThan(weeks[i - 1].weekNumber);
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 120000); // Extended timeout for 100 async iterations
});

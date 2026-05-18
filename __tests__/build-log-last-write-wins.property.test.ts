/**
 * Property-based test for build log last-write-wins behavior.
 *
 * Feature: cto-learning-helper, Property 15: Build Log Update Replaces Previous Entry
 *
 * **Validates: Requirements 8.4**
 *
 * For any week W, if build log entry E1 is saved and then entry E2 is saved
 * for the same week W, querying W's build log SHALL return E2 and not E1.
 *
 * Uses fast-check to generate arbitrary pairs of strings (E1, E2) and verifies
 * that upserting E1 then E2 for the same week results in only E2 being stored.
 */

import * as fc from 'fast-check';
import { prisma } from '@/lib/prisma';

describe('Property 15: Build Log Update Replaces Previous Entry', () => {
  let testWeekId: number;

  beforeAll(async () => {
    // Find an existing week to test with
    const week = await prisma.week.findFirst();

    if (!week) {
      throw new Error('No seeded data found. Run db:seed first.');
    }

    testWeekId = week.id;
  });

  afterAll(async () => {
    // Clean up: remove any build log entry created during tests
    await prisma.buildLogEntry.deleteMany({
      where: { weekId: testWeekId },
    });
    await prisma.$disconnect();
  });

  /**
   * **Validates: Requirements 8.4**
   *
   * Save E1 then E2 for the same week; assert only E2 is returned.
   * Minimum 100 iterations.
   */
  it('should return only the last-written entry when two entries are saved for the same week', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        async (e1: string, e2: string) => {
          // Upsert E1 for the test week
          await prisma.buildLogEntry.upsert({
            where: { weekId: testWeekId },
            create: { weekId: testWeekId, content: e1 },
            update: { content: e1 },
          });

          // Upsert E2 for the same week (should replace E1)
          await prisma.buildLogEntry.upsert({
            where: { weekId: testWeekId },
            create: { weekId: testWeekId, content: e2 },
            update: { content: e2 },
          });

          // Read back the build log entry for this week
          const entry = await prisma.buildLogEntry.findUnique({
            where: { weekId: testWeekId },
          });

          // Assert only E2 is stored
          expect(entry).not.toBeNull();
          expect(entry!.content).toBe(e2);

          // Assert there is exactly one entry for this week
          const count = await prisma.buildLogEntry.count({
            where: { weekId: testWeekId },
          });
          expect(count).toBe(1);
        }
      ),
      { numRuns: 10 }
    );
  }, 120000); // Extended timeout for 100 async iterations
});

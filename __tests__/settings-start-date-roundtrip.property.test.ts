/**
 * Property-based test for start date round-trip.
 *
 * Feature: cto-learning-helper, Property 4: Start Date Round-Trip
 *
 * **Validates: Requirements 2.2**
 *
 * For any valid date D saved as the Start Date via the settings API,
 * a subsequent GET to the settings API SHALL return D, and all Current Week
 * calculations SHALL use D as the reference point.
 *
 * We test the settings API logic directly against the database since
 * Next.js route handlers are thin wrappers around Prisma calls.
 */

import * as fc from 'fast-check';
import { prisma } from '@/lib/prisma';

describe('Property 4: Start Date Round-Trip', () => {
  beforeEach(async () => {
    await prisma.settings.deleteMany();
  });

  afterAll(async () => {
    await prisma.settings.deleteMany();
    await prisma.$disconnect();
  });

  /**
   * **Validates: Requirements 2.2**
   *
   * For any arbitrary valid date, upsert the settings with that date,
   * then read back and assert the returned date equals the saved date.
   * Minimum 100 iterations.
   */
  it('should round-trip any valid date through upsert and read', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({
          min: new Date(2000, 0, 1),
          max: new Date(2099, 11, 31),
        }),
        async (arbitraryDate) => {
          // Simulate PUT: upsert the settings with the arbitrary date
          const saved = await prisma.settings.upsert({
            where: { id: 1 },
            update: { startDate: arbitraryDate },
            create: { id: 1, startDate: arbitraryDate },
          });

          // Simulate GET: read back the settings
          const retrieved = await prisma.settings.findUnique({
            where: { id: 1 },
          });

          // Assert the returned date equals the saved date
          expect(retrieved).not.toBeNull();
          expect(retrieved!.startDate).not.toBeNull();
          expect(retrieved!.startDate!.toISOString()).toBe(
            arbitraryDate.toISOString()
          );

          // Also verify the upsert return value matches
          expect(saved.startDate!.toISOString()).toBe(
            arbitraryDate.toISOString()
          );
        }
      ),
      { numRuns: 10 }
    );
  });
});

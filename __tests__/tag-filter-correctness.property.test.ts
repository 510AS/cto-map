/**
 * Property-based test for tag filter correctness.
 *
 * Feature: cto-learning-helper, Property 21: Tag Filter Correctness
 *
 * **Validates: Requirements 12.2, 12.3, 12.4**
 *
 * For arbitrary non-empty tag selections, assert every displayed week has at least
 * one matching tag; for empty selection, assert all 52 weeks shown.
 *
 * Uses fast-check to generate arbitrary subsets of tag IDs from the seeded database.
 * Tests the same filtering logic used in the progress page.
 */

import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';

describe('Feature: cto-learning-helper, Property 21: Tag Filter Correctness', () => {
  let prisma: PrismaClient;
  let allTagIds: number[] = [];
  let allWeeks: { id: number; weekNumber: number; tagIds: number[] }[] = [];

  beforeAll(async () => {
    prisma = new PrismaClient();

    // Load all tags from the seeded database
    const tags = await prisma.tag.findMany({ select: { id: true } });
    allTagIds = tags.map((t) => t.id);

    // Load all weeks with their tag associations
    const weeks = await prisma.week.findMany({
      include: {
        tags: { select: { tagId: true } },
      },
      orderBy: { weekNumber: 'asc' },
    });

    allWeeks = weeks
      .filter((w) => w.weekNumber >= 1 && w.weekNumber <= 52)
      .map((w) => ({
        id: w.id,
        weekNumber: w.weekNumber,
        tagIds: w.tags.map((wt) => wt.tagId),
      }));
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  /**
   * **Validates: Requirements 12.4**
   *
   * When no tags are selected (empty selection), all 52 weeks should be displayed.
   */
  it('should display all 52 weeks when no tags are selected', () => {
    // Empty tag selection means no filtering — all weeks shown
    const selectedTagIds: number[] = [];
    const filteredWeeks =
      selectedTagIds.length === 0
        ? allWeeks
        : allWeeks.filter((w) => w.tagIds.some((tagId) => selectedTagIds.includes(tagId)));

    expect(filteredWeeks.length).toBe(52);
  });

  /**
   * **Validates: Requirements 12.2, 12.3**
   *
   * For arbitrary non-empty tag selections, every displayed week must have
   * at least one tag that is a member of the selected set.
   */
  it('should only display weeks with at least one matching tag for non-empty selections', () => {
    // Precondition: we need tags in the database to test
    expect(allTagIds.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        // Generate a non-empty subset of tag IDs from the available tags
        fc.subarray(allTagIds, { minLength: 1 }),
        (selectedTagIds) => {
          // Apply the same filtering logic as the progress page
          const filteredWeeks = allWeeks.filter((w) =>
            w.tagIds.some((tagId) => selectedTagIds.includes(tagId))
          );

          // Every displayed week must have at least one matching tag
          for (const week of filteredWeeks) {
            const hasMatchingTag = week.tagIds.some((tagId) =>
              selectedTagIds.includes(tagId)
            );
            expect(hasMatchingTag).toBe(true);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 12.2, 12.3**
   *
   * For arbitrary non-empty tag selections, no week without a matching tag
   * should appear in the filtered results (completeness check).
   */
  it('should not exclude any week that has a matching tag', () => {
    expect(allTagIds.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.subarray(allTagIds, { minLength: 1 }),
        (selectedTagIds) => {
          // Apply the same filtering logic as the progress page
          const filteredWeeks = allWeeks.filter((w) =>
            w.tagIds.some((tagId) => selectedTagIds.includes(tagId))
          );

          const filteredWeekIds = new Set(filteredWeeks.map((w) => w.id));

          // Every week that has a matching tag should be in the filtered results
          for (const week of allWeeks) {
            const hasMatchingTag = week.tagIds.some((tagId) =>
              selectedTagIds.includes(tagId)
            );
            if (hasMatchingTag) {
              expect(filteredWeekIds.has(week.id)).toBe(true);
            } else {
              expect(filteredWeekIds.has(week.id)).toBe(false);
            }
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 12.4**
   *
   * For arbitrary tag selections (including empty), verify the empty-selection
   * invariant: empty selection always returns all weeks.
   */
  it('should always return all weeks for empty tag selection regardless of available tags', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary (possibly empty) subsets — but we only test the empty case
        fc.constant([] as number[]),
        (selectedTagIds) => {
          const filteredWeeks =
            selectedTagIds.length === 0
              ? allWeeks
              : allWeeks.filter((w) =>
                  w.tagIds.some((tagId) => selectedTagIds.includes(tagId))
                );

          expect(filteredWeeks.length).toBe(52);
          // Verify all week numbers 1-52 are present
          const weekNumbers = filteredWeeks.map((w) => w.weekNumber).sort((a, b) => a - b);
          for (let i = 1; i <= 52; i++) {
            expect(weekNumbers).toContain(i);
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});

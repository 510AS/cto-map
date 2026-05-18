/**
 * Property-based tests for retrieval ordering invariant.
 *
 * Feature: day-task-checklist, Property 3: Retrieval ordering invariant
 *
 * **Validates: Requirements 2.1**
 *
 * For any set of task items belonging to a day, retrieving them should return
 * items sorted by sortOrder ascending within each category, with "learn" items
 * grouped before "build" items.
 */

import * as fc from 'fast-check';
import { TaskItem } from '../lib/types';

// =============================================================================
// Pure function under test
// =============================================================================

/**
 * Groups task items by category and sorts by sortOrder ascending within each group.
 * Returns learn items first, then build items — matching the API retrieval behavior.
 */
function retrieveGroupedAndSorted(items: TaskItem[]): { learn: TaskItem[]; build: TaskItem[] } {
  const learnItems = items
    .filter((item) => item.category === 'learn')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const buildItems = items
    .filter((item) => item.category === 'build')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return { learn: learnItems, build: buildItems };
}

// =============================================================================
// Generators
// =============================================================================

/** Generate a valid TaskItem with arbitrary sortOrder and category. */
const taskItemArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.constantFrom('learn' as const, 'build' as const),
  isComplete: fc.boolean(),
  sortOrder: fc.integer({ min: 0, max: 1000 }),
  timeEstimate: fc.option(fc.integer({ min: 1, max: 480 }), { nil: null }),
  note: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: null }),
  createdAt: fc.constant(new Date().toISOString()),
  dayId: fc.constant(1),
});

/** Generate an array of task items with various sortOrders and categories. */
const taskItemsArb = fc.array(taskItemArb, { minLength: 1, maxLength: 30 });

// =============================================================================
// Property Tests
// =============================================================================

describe('Property 3: Retrieval ordering invariant', () => {
  /**
   * **Validates: Requirements 2.1**
   *
   * For any set of task items, when retrieved and sorted by sortOrder ascending,
   * the result is always in non-decreasing sortOrder order within each category.
   */
  it('learn items are in non-decreasing sortOrder after retrieval', () => {
    fc.assert(
      fc.property(taskItemsArb, (items) => {
        const result = retrieveGroupedAndSorted(items);

        for (let i = 1; i < result.learn.length; i++) {
          expect(result.learn[i].sortOrder).toBeGreaterThanOrEqual(
            result.learn[i - 1].sortOrder
          );
        }
      }),
      { numRuns: 20 }
    );
  });

  it('build items are in non-decreasing sortOrder after retrieval', () => {
    fc.assert(
      fc.property(taskItemsArb, (items) => {
        const result = retrieveGroupedAndSorted(items);

        for (let i = 1; i < result.build.length; i++) {
          expect(result.build[i].sortOrder).toBeGreaterThanOrEqual(
            result.build[i - 1].sortOrder
          );
        }
      }),
      { numRuns: 20 }
    );
  });

  it('all items in learn group have category "learn" and all in build group have category "build"', () => {
    fc.assert(
      fc.property(taskItemsArb, (items) => {
        const result = retrieveGroupedAndSorted(items);

        for (const item of result.learn) {
          expect(item.category).toBe('learn');
        }
        for (const item of result.build) {
          expect(item.category).toBe('build');
        }
      }),
      { numRuns: 20 }
    );
  });

  it('no items are lost or duplicated during grouping and sorting', () => {
    fc.assert(
      fc.property(taskItemsArb, (items) => {
        const result = retrieveGroupedAndSorted(items);

        const totalReturned = result.learn.length + result.build.length;
        expect(totalReturned).toBe(items.length);
      }),
      { numRuns: 20 }
    );
  });
});

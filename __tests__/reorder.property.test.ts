/**
 * Property-based tests for reorder stability.
 *
 * Feature: day-task-checklist, Property 5: Reorder stability
 *
 * **Validates: Requirements 4.1, 4.2**
 *
 * For any list of task items in a category and any valid permutation of their IDs:
 * - Reordering with the same IDs in a different order produces a valid permutation
 * - The set of IDs before and after reorder is identical (no items lost or duplicated)
 * - Applying the identity permutation (same order) results in no change
 */

import * as fc from 'fast-check';
import { applyReorder } from '../lib/reorder';
import { TaskItem } from '../lib/types';

// =============================================================================
// Generators
// =============================================================================

/** Generate a task item with a given id and sortOrder. */
function makeTaskItem(id: number, sortOrder: number, category: 'learn' | 'build' = 'learn'): TaskItem {
  return {
    id,
    title: `Task ${id}`,
    category,
    isComplete: false,
    sortOrder,
    timeEstimate: null,
    note: null,
    createdAt: new Date().toISOString(),
    dayId: 1,
  };
}

/** Generate a non-empty array of task items with unique IDs and sequential sortOrders. */
const taskItemsArb = fc
  .integer({ min: 1, max: 20 })
  .chain((length) =>
    fc.tuple(
      fc.constant(length),
      fc.constantFrom('learn' as const, 'build' as const)
    )
  )
  .map(([length, category]) =>
    Array.from({ length }, (_, idx) => makeTaskItem(idx + 1, idx, category))
  );

/** Generate a non-empty array of task items along with a shuffled permutation of their IDs. */
const taskItemsWithShuffledIdsArb = taskItemsArb.chain((items) =>
  fc.shuffledSubarray(items.map((item) => item.id), { minLength: items.length, maxLength: items.length })
    .map((shuffledIds) => ({ items, shuffledIds }))
);

// =============================================================================
// Property Tests
// =============================================================================

describe('Property 5: Reorder stability', () => {
  /**
   * **Validates: Requirements 4.1, 4.2**
   *
   * Reordering with the same IDs in a different order produces a valid permutation.
   * The resulting sortOrder values should be a valid assignment (0..n-1).
   */
  it('reordering produces valid sortOrder values (0 to n-1)', () => {
    fc.assert(
      fc.property(
        taskItemsWithShuffledIdsArb,
        ({ items, shuffledIds }) => {
          const result = applyReorder(items, shuffledIds);

          // All sortOrder values should be in range [0, items.length - 1]
          const sortOrders = result.map((item) => item.sortOrder).sort((a, b) => a - b);
          const expected = Array.from({ length: items.length }, (_, i) => i);
          expect(sortOrders).toEqual(expected);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 4.1, 4.2**
   *
   * The set of IDs before and after reorder is identical (no items lost or duplicated).
   */
  it('set of IDs is preserved after reorder (no items lost or duplicated)', () => {
    fc.assert(
      fc.property(
        taskItemsWithShuffledIdsArb,
        ({ items, shuffledIds }) => {
          const result = applyReorder(items, shuffledIds);

          const originalIds = new Set(items.map((item) => item.id));
          const resultIds = new Set(result.map((item) => item.id));

          expect(resultIds).toEqual(originalIds);
          expect(result.length).toBe(items.length);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 4.1, 4.2**
   *
   * Applying the identity permutation (same order) results in no change to sortOrder values.
   */
  it('identity permutation produces no change in sortOrder', () => {
    fc.assert(
      fc.property(
        taskItemsArb,
        (items) => {
          // Identity permutation: IDs in their current sortOrder
          const identityIds = [...items]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((item) => item.id);

          const result = applyReorder(items, identityIds);

          // Each item should have the same sortOrder as before
          for (const original of items) {
            const reordered = result.find((r) => r.id === original.id);
            expect(reordered).toBeDefined();
            expect(reordered!.sortOrder).toBe(original.sortOrder);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 4.1, 4.2**
   *
   * The moved item ends up at the correct position and other items maintain relative order.
   */
  it('moved item gets correct sortOrder and others maintain relative order', () => {
    fc.assert(
      fc.property(
        taskItemsWithShuffledIdsArb,
        ({ items, shuffledIds }) => {
          const result = applyReorder(items, shuffledIds);

          // Each item's new sortOrder should match its position in shuffledIds
          for (let i = 0; i < shuffledIds.length; i++) {
            const id = shuffledIds[i];
            const reorderedItem = result.find((item) => item.id === id);
            expect(reorderedItem).toBeDefined();
            expect(reorderedItem!.sortOrder).toBe(i);
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});

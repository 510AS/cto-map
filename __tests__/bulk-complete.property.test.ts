/**
 * Property-based test for bulk-complete via completion calculator.
 *
 * Feature: day-task-checklist, Property 7: Bulk-complete marks all items complete
 *
 * **Validates: Requirements 6.1**
 *
 * For any set of task items in a given category (with any mix of complete and
 * incomplete states), performing bulk-complete should result in all items in
 * that category having isComplete=true, and the completion calculator should
 * report that category as complete.
 */

import * as fc from 'fast-check';
import { calculateDayCompletion } from '../lib/completion-calculator';
import { TaskItem } from '../lib/types';

// =============================================================================
// Generators
// =============================================================================

/**
 * Generates a valid TaskItem with the specified category and any completion state.
 */
function taskItemArb(category: 'learn' | 'build', id: number): fc.Arbitrary<TaskItem> {
  return fc.record({
    id: fc.constant(id),
    title: fc.string({ minLength: 1, maxLength: 50 }),
    category: fc.constant(category),
    isComplete: fc.boolean(),
    sortOrder: fc.constant(id),
    timeEstimate: fc.option(fc.integer({ min: 1, max: 480 }), { nil: null }),
    note: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: null }),
    createdAt: fc.constant(new Date().toISOString()),
    dayId: fc.constant(1),
  });
}

/**
 * Generates a non-empty array of task items for a given category.
 */
function taskItemsForCategoryArb(category: 'learn' | 'build'): fc.Arbitrary<TaskItem[]> {
  return fc.integer({ min: 1, max: 20 }).chain((count) =>
    fc.tuple(...Array.from({ length: count }, (_, i) => taskItemArb(category, i + 1)))
  );
}

/**
 * Generates a category value.
 */
const categoryArb: fc.Arbitrary<'learn' | 'build'> = fc.constantFrom('learn', 'build');

// =============================================================================
// Property 7: Bulk-complete marks all items complete
// =============================================================================

describe('Property 7: Bulk-complete marks all items complete', () => {
  /**
   * **Validates: Requirements 6.1**
   *
   * For any set of task items in a given category, simulating bulk-complete
   * (setting all items to isComplete=true) should cause the completion
   * calculator to report that category as complete.
   */
  it('bulk-completing all items in a category causes the calculator to report that category as complete', () => {
    fc.assert(
      fc.property(
        categoryArb,
        fc.integer({ min: 1, max: 20 }).chain((count) =>
          fc.tuple(
            fc.constant(count),
            fc.tuple(...Array.from({ length: count }, (_, i) => taskItemArb('learn', i + 1))),
            fc.tuple(...Array.from({ length: count }, (_, i) => taskItemArb('build', i + 100)))
          )
        ),
        (targetCategory, [_count, learnItems, buildItems]) => {
          // Simulate bulk-complete: mark all items in the target category as complete
          const bulkCompletedItems = [...learnItems, ...buildItems].map((item) => {
            if (item.category === targetCategory) {
              return { ...item, isComplete: true };
            }
            return item;
          });

          const result = calculateDayCompletion(bulkCompletedItems);

          // The target category should be reported as complete
          if (targetCategory === 'learn') {
            expect(result.learnComplete).toBe(true);
          } else {
            expect(result.buildComplete).toBe(true);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 6.1**
   *
   * For any set of task items in a single category with mixed completion states,
   * bulk-completing them all should result in the calculator reporting complete.
   */
  it('bulk-completing a single category with mixed initial states reports complete', () => {
    fc.assert(
      fc.property(
        categoryArb,
        fc.integer({ min: 1, max: 20 }).chain((count) =>
          fc.tuple(...Array.from({ length: count }, (_, i) =>
            taskItemArb(count > 0 ? 'learn' : 'build', i + 1)
          ))
        ),
        (category, items) => {
          // Override category to match the target and simulate bulk-complete
          const bulkCompleted: TaskItem[] = items.map((item) => ({
            ...item,
            category,
            isComplete: true,
          }));

          const result = calculateDayCompletion(bulkCompleted);

          if (category === 'learn') {
            expect(result.learnComplete).toBe(true);
          } else {
            expect(result.buildComplete).toBe(true);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 6.1**
   *
   * Bulk-complete on one category should not affect the other category's
   * completion state — the other category's result depends only on its own items.
   */
  it('bulk-completing one category does not affect the other category completion', () => {
    fc.assert(
      fc.property(
        categoryArb,
        fc.integer({ min: 1, max: 10 }).chain((learnCount) =>
          fc.tuple(...Array.from({ length: learnCount }, (_, i) => taskItemArb('learn', i + 1)))
        ),
        fc.integer({ min: 1, max: 10 }).chain((buildCount) =>
          fc.tuple(...Array.from({ length: buildCount }, (_, i) => taskItemArb('build', i + 100)))
        ),
        (targetCategory, learnItems, buildItems) => {
          // Simulate bulk-complete on target category only
          const allItems = [...learnItems, ...buildItems].map((item) => {
            if (item.category === targetCategory) {
              return { ...item, isComplete: true };
            }
            return item;
          });

          const result = calculateDayCompletion(allItems);

          // The OTHER category's completion should depend on its own items' states
          const otherCategory = targetCategory === 'learn' ? 'build' : 'learn';
          const otherItems = allItems.filter((item) => item.category === otherCategory);
          const otherExpected = otherItems.every((item) => item.isComplete);

          if (otherCategory === 'learn') {
            expect(result.learnComplete).toBe(otherExpected);
          } else {
            expect(result.buildComplete).toBe(otherExpected);
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});

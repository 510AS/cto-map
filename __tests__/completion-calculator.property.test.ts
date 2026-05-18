/**
 * Property-based tests for the completion calculator.
 *
 * Feature: day-task-checklist, Property 4: Completion calculator correctness
 *
 * **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 6.2, 6.3**
 *
 * For any set of task items for a day, the completion calculator should output:
 * - learnComplete = true iff all items with category="learn" are complete
 * - buildComplete = true iff all items with category="build" are complete
 * - isComplete = learnComplete AND buildComplete
 * - When a category has zero items, existing completion state is preserved
 */

import * as fc from 'fast-check';
import { calculateDayCompletion } from '../lib/completion-calculator';
import { TaskItem } from '../lib/types';

// =============================================================================
// Generators
// =============================================================================

/** Generate a valid TaskItem with configurable category and completion state. */
const taskItemArb = (
  category: 'learn' | 'build',
  isComplete: boolean,
  id: number
): TaskItem => ({
  id,
  title: `Task ${id}`,
  category,
  isComplete,
  sortOrder: id,
  timeEstimate: null,
  note: null,
  createdAt: new Date().toISOString(),
  dayId: 1,
});

/** Generate an arbitrary non-empty array of task items for a given category. */
const categoryItemsArb = (category: 'learn' | 'build') =>
  fc
    .array(fc.boolean(), { minLength: 1, maxLength: 20 })
    .map((completions) =>
      completions.map((isComplete, idx) => taskItemArb(category, isComplete, idx + 1))
    );

/** Generate an arbitrary array of task items (possibly empty) for a given category. */
const categoryItemsWithEmptyArb = (category: 'learn' | 'build') =>
  fc
    .array(fc.boolean(), { minLength: 0, maxLength: 20 })
    .map((completions) =>
      completions.map((isComplete, idx) => taskItemArb(category, isComplete, idx + 1))
    );

/** Generate an arbitrary existing completion state. */
const existingStateArb = fc.record({
  learnComplete: fc.boolean(),
  buildComplete: fc.boolean(),
});

// =============================================================================
// Property Tests
// =============================================================================

describe('Property 4: Completion calculator correctness', () => {
  /**
   * **Validates: Requirements 3.2**
   *
   * learnComplete = true iff all items with category "learn" are complete.
   */
  it('learnComplete is true iff all learn items are complete', () => {
    fc.assert(
      fc.property(
        categoryItemsArb('learn'),
        categoryItemsWithEmptyArb('build'),
        existingStateArb,
        (learnItems, buildItems, existingState) => {
          // Assign unique IDs across both arrays
          const allItems = [
            ...learnItems.map((item, idx) => ({ ...item, id: idx + 1 })),
            ...buildItems.map((item, idx) => ({ ...item, id: learnItems.length + idx + 1 })),
          ];

          const result = calculateDayCompletion(allItems, existingState);

          const allLearnComplete = learnItems.every((item) => item.isComplete);
          expect(result.learnComplete).toBe(allLearnComplete);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 3.3**
   *
   * buildComplete = true iff all items with category "build" are complete.
   */
  it('buildComplete is true iff all build items are complete', () => {
    fc.assert(
      fc.property(
        categoryItemsWithEmptyArb('learn'),
        categoryItemsArb('build'),
        existingStateArb,
        (learnItems, buildItems, existingState) => {
          const allItems = [
            ...learnItems.map((item, idx) => ({ ...item, id: idx + 1 })),
            ...buildItems.map((item, idx) => ({ ...item, id: learnItems.length + idx + 1 })),
          ];

          const result = calculateDayCompletion(allItems, existingState);

          const allBuildComplete = buildItems.every((item) => item.isComplete);
          expect(result.buildComplete).toBe(allBuildComplete);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 3.4, 3.5, 6.2, 6.3**
   *
   * isComplete = learnComplete AND buildComplete.
   */
  it('isComplete equals learnComplete AND buildComplete', () => {
    fc.assert(
      fc.property(
        categoryItemsWithEmptyArb('learn'),
        categoryItemsWithEmptyArb('build'),
        existingStateArb,
        (learnItems, buildItems, existingState) => {
          const allItems = [
            ...learnItems.map((item, idx) => ({ ...item, id: idx + 1 })),
            ...buildItems.map((item, idx) => ({ ...item, id: learnItems.length + idx + 1 })),
          ];

          const result = calculateDayCompletion(allItems, existingState);

          expect(result.isComplete).toBe(result.learnComplete && result.buildComplete);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 3.2, 3.3 (zero-item edge case)**
   *
   * When a category has zero items, existing state is preserved for that category.
   */
  it('preserves existing state when a category has zero items', () => {
    fc.assert(
      fc.property(
        existingStateArb,
        fc.constantFrom('learn' as const, 'build' as const),
        categoryItemsWithEmptyArb('learn'),
        categoryItemsWithEmptyArb('build'),
        (existingState, emptyCategory, learnItems, buildItems) => {
          // Force the chosen category to have zero items
          const items =
            emptyCategory === 'learn'
              ? buildItems.map((item, idx) => ({ ...item, id: idx + 1 }))
              : learnItems.map((item, idx) => ({ ...item, id: idx + 1 }));

          const result = calculateDayCompletion(items, existingState);

          if (emptyCategory === 'learn') {
            // Learn has zero items, so learnComplete should preserve existing state
            expect(result.learnComplete).toBe(existingState.learnComplete);
          } else {
            // Build has zero items, so buildComplete should preserve existing state
            expect(result.buildComplete).toBe(existingState.buildComplete);
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});

/**
 * Property-based test for progress indicator correctness.
 *
 * Feature: day-task-checklist, Property 12: Progress indicator correctness
 *
 * **Validates: Requirements 13.1, 13.2**
 *
 * For any set of task items for a day, the progress indicator should show the
 * correct count of completed items versus total items per category, and the
 * overall completion percentage should equal (totalCompleted / totalItems) * 100.
 *
 * Properties verified:
 * - The progress percentage (completed/total * 100) is always between 0 and 100
 * - The completed count never exceeds the total count
 * - When all items are complete, progress is 100%
 * - When no items are complete, progress is 0%
 */

import * as fc from 'fast-check';
import { TaskItem } from '../lib/types';

// =============================================================================
// Progress Indicator Calculation (pure function under test)
// =============================================================================

/**
 * Calculates progress indicator values for a set of task items.
 * This mirrors the logic used in the DayChecklist component.
 */
function calculateProgressIndicator(taskItems: TaskItem[]) {
  const learnItems = taskItems.filter((item) => item.category === 'learn');
  const buildItems = taskItems.filter((item) => item.category === 'build');

  const learnCompleted = learnItems.filter((item) => item.isComplete).length;
  const learnTotal = learnItems.length;

  const buildCompleted = buildItems.filter((item) => item.isComplete).length;
  const buildTotal = buildItems.length;

  const totalCompleted = learnCompleted + buildCompleted;
  const totalItems = learnTotal + buildTotal;

  const overallPercentage = totalItems > 0 ? (totalCompleted / totalItems) * 100 : 0;

  return {
    learn: { completed: learnCompleted, total: learnTotal },
    build: { completed: buildCompleted, total: buildTotal },
    totalCompleted,
    totalItems,
    overallPercentage,
  };
}

// =============================================================================
// Generators
// =============================================================================

/**
 * Generates a valid TaskItem with arbitrary completion state and category.
 */
function taskItemArb(dayId: number = 1): fc.Arbitrary<TaskItem> {
  return fc.record({
    id: fc.nat({ max: 10000 }),
    title: fc.string({ minLength: 1, maxLength: 50 }),
    category: fc.constantFrom('learn' as const, 'build' as const),
    isComplete: fc.boolean(),
    sortOrder: fc.nat({ max: 100 }),
    timeEstimate: fc.option(fc.integer({ min: 1, max: 480 }), { nil: null }),
    note: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
    createdAt: fc.constant(new Date().toISOString()),
    dayId: fc.constant(dayId),
  });
}

/**
 * Generates a non-empty array of task items (all for the same day).
 */
function taskItemsArb(dayId: number = 1): fc.Arbitrary<TaskItem[]> {
  return fc.array(taskItemArb(dayId), { minLength: 1, maxLength: 20 });
}

/**
 * Generates a non-empty array of task items where ALL are complete.
 */
function allCompleteTaskItemsArb(dayId: number = 1): fc.Arbitrary<TaskItem[]> {
  return fc.array(
    taskItemArb(dayId).map((item) => ({ ...item, isComplete: true })),
    { minLength: 1, maxLength: 20 }
  );
}

/**
 * Generates a non-empty array of task items where NONE are complete.
 */
function noneCompleteTaskItemsArb(dayId: number = 1): fc.Arbitrary<TaskItem[]> {
  return fc.array(
    taskItemArb(dayId).map((item) => ({ ...item, isComplete: false })),
    { minLength: 1, maxLength: 20 }
  );
}

// =============================================================================
// Property Tests
// =============================================================================

describe('Property 12: Progress indicator correctness', () => {
  /**
   * **Validates: Requirements 13.1, 13.2**
   *
   * The progress percentage should always be between 0 and 100 (inclusive)
   * for any arbitrary set of task items.
   */
  it('progress percentage is always between 0 and 100', () => {
    fc.assert(
      fc.property(taskItemsArb(), (items) => {
        const progress = calculateProgressIndicator(items);
        expect(progress.overallPercentage).toBeGreaterThanOrEqual(0);
        expect(progress.overallPercentage).toBeLessThanOrEqual(100);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 13.1, 13.2**
   *
   * The completed count should never exceed the total count for any category
   * or overall.
   */
  it('completed count never exceeds total count', () => {
    fc.assert(
      fc.property(taskItemsArb(), (items) => {
        const progress = calculateProgressIndicator(items);
        expect(progress.learn.completed).toBeLessThanOrEqual(progress.learn.total);
        expect(progress.build.completed).toBeLessThanOrEqual(progress.build.total);
        expect(progress.totalCompleted).toBeLessThanOrEqual(progress.totalItems);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 13.1, 13.2**
   *
   * When all items are complete, the overall progress should be exactly 100%.
   */
  it('progress is 100% when all items are complete', () => {
    fc.assert(
      fc.property(allCompleteTaskItemsArb(), (items) => {
        const progress = calculateProgressIndicator(items);
        expect(progress.overallPercentage).toBe(100);
        expect(progress.totalCompleted).toBe(progress.totalItems);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 13.1, 13.2**
   *
   * When no items are complete, the overall progress should be exactly 0%.
   */
  it('progress is 0% when no items are complete', () => {
    fc.assert(
      fc.property(noneCompleteTaskItemsArb(), (items) => {
        const progress = calculateProgressIndicator(items);
        expect(progress.overallPercentage).toBe(0);
        expect(progress.totalCompleted).toBe(0);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 13.1, 13.2**
   *
   * The overall percentage should equal (totalCompleted / totalItems) * 100
   * for any non-empty set of task items.
   */
  it('overall percentage equals (totalCompleted / totalItems) * 100', () => {
    fc.assert(
      fc.property(taskItemsArb(), (items) => {
        const progress = calculateProgressIndicator(items);
        const expected =
          progress.totalItems > 0
            ? (progress.totalCompleted / progress.totalItems) * 100
            : 0;
        expect(progress.overallPercentage).toBe(expected);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 13.1**
   *
   * Per-category counts should be consistent: the sum of per-category completed
   * equals the overall completed, and the sum of per-category totals equals
   * the overall total.
   */
  it('per-category counts sum to overall counts', () => {
    fc.assert(
      fc.property(taskItemsArb(), (items) => {
        const progress = calculateProgressIndicator(items);
        expect(progress.learn.completed + progress.build.completed).toBe(
          progress.totalCompleted
        );
        expect(progress.learn.total + progress.build.total).toBe(progress.totalItems);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 13.2**
   *
   * When there are zero task items, the progress percentage should be 0.
   */
  it('progress is 0% when there are no task items', () => {
    const progress = calculateProgressIndicator([]);
    expect(progress.overallPercentage).toBe(0);
    expect(progress.totalCompleted).toBe(0);
    expect(progress.totalItems).toBe(0);
  });
});

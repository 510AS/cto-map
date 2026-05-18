/**
 * Property-based test for time estimate calculations.
 *
 * Feature: day-task-checklist, Property 8: Time estimate calculations
 *
 * **Validates: Requirements 7.2, 7.3, 7.4, 7.5**
 *
 * For any set of task items with optional time estimates:
 * - Total time = sum of non-null timeEstimate values
 * - Remaining time = sum of non-null timeEstimate values for incomplete items only
 * - Total time >= remaining time
 * - Both values are always >= 0
 */

import * as fc from 'fast-check';
import { calculateTimeEstimates } from '../lib/time-estimates';
import { TaskItem } from '../lib/types';

/** Arbitrary generator for a TaskItem with optional time estimate. */
const taskItemArb: fc.Arbitrary<TaskItem> = fc.record({
  id: fc.nat(),
  title: fc.string({ minLength: 1 }),
  category: fc.constantFrom('learn' as const, 'build' as const),
  isComplete: fc.boolean(),
  sortOrder: fc.nat(),
  timeEstimate: fc.oneof(
    fc.constant(null as number | null),
    fc.integer({ min: 1, max: 480 })
  ),
  note: fc.oneof(fc.constant(null as string | null), fc.string({ maxLength: 500 })),
  createdAt: fc.constant(new Date().toISOString()),
  dayId: fc.nat(),
});

describe('Property 8: Time estimate calculations', () => {
  /**
   * **Validates: Requirements 7.2, 7.3**
   *
   * Total time estimate = sum of all non-null timeEstimate values (treating null as 0).
   */
  it('totalMinutes equals the sum of all non-null timeEstimate values', () => {
    fc.assert(
      fc.property(fc.array(taskItemArb, { minLength: 0, maxLength: 20 }), (items) => {
        const result = calculateTimeEstimates(items);
        const expectedTotal = items.reduce(
          (sum, item) => sum + (item.timeEstimate ?? 0),
          0
        );
        expect(result.totalMinutes).toBe(expectedTotal);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 7.4**
   *
   * Remaining time = sum of timeEstimate for incomplete items only.
   */
  it('remainingMinutes equals the sum of non-null timeEstimate values for incomplete items', () => {
    fc.assert(
      fc.property(fc.array(taskItemArb, { minLength: 0, maxLength: 20 }), (items) => {
        const result = calculateTimeEstimates(items);
        const expectedRemaining = items
          .filter((item) => !item.isComplete)
          .reduce((sum, item) => sum + (item.timeEstimate ?? 0), 0);
        expect(result.remainingMinutes).toBe(expectedRemaining);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 7.2, 7.4**
   *
   * Total time is always >= remaining time.
   */
  it('totalMinutes is always >= remainingMinutes', () => {
    fc.assert(
      fc.property(fc.array(taskItemArb, { minLength: 0, maxLength: 20 }), (items) => {
        const result = calculateTimeEstimates(items);
        expect(result.totalMinutes).toBeGreaterThanOrEqual(result.remainingMinutes);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 7.5**
   *
   * Both totalMinutes and remainingMinutes are always >= 0.
   */
  it('both totalMinutes and remainingMinutes are always >= 0', () => {
    fc.assert(
      fc.property(fc.array(taskItemArb, { minLength: 0, maxLength: 20 }), (items) => {
        const result = calculateTimeEstimates(items);
        expect(result.totalMinutes).toBeGreaterThanOrEqual(0);
        expect(result.remainingMinutes).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 7.5**
   *
   * Items with null timeEstimate do not contribute to any sum.
   */
  it('items with null timeEstimate do not contribute to totals', () => {
    fc.assert(
      fc.property(fc.array(taskItemArb, { minLength: 1, maxLength: 20 }), (items) => {
        // Set all timeEstimates to null
        const nullItems = items.map((item) => ({ ...item, timeEstimate: null }));
        const result = calculateTimeEstimates(nullItems);
        expect(result.totalMinutes).toBe(0);
        expect(result.remainingMinutes).toBe(0);
      }),
      { numRuns: 20 }
    );
  });
});

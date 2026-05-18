/**
 * Property-based test for statistics calculator correctness.
 *
 * Feature: day-task-checklist, Property 11: Statistics calculator correctness
 *
 * **Validates: Requirements 12.1, 12.2, 12.3, 12.4**
 *
 * For any set of days with task items:
 * - averageItemsPerDay is always >= 0
 * - overallCompletionRate is always between 0 and 100
 * - currentWeekRate and previousWeekRate are always between 0 and 100
 * - hasSufficientData is true iff days with items >= 7
 * - mostProductiveDay is null when no days have items, otherwise is a valid day name
 */

import * as fc from 'fast-check';
import { calculateChecklistStats } from '@/lib/checklist-stats';
import { TaskItem } from '@/lib/types';

const VALID_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Arbitrary for a single TaskItem with configurable completion state. */
const taskItemArb = (dayId: number): fc.Arbitrary<TaskItem> =>
  fc.record({
    id: fc.nat({ max: 100000 }),
    title: fc.string({ minLength: 1, maxLength: 50 }),
    category: fc.constantFrom('learn' as const, 'build' as const),
    isComplete: fc.boolean(),
    sortOrder: fc.nat({ max: 100 }),
    timeEstimate: fc.oneof(fc.constant(null), fc.integer({ min: 1, max: 480 })),
    note: fc.oneof(fc.constant(null), fc.string({ minLength: 0, maxLength: 100 })),
    createdAt: fc.constant(new Date().toISOString()),
    dayId: fc.constant(dayId),
  });

/** Arbitrary for a day record with dayOfWeek and taskItems. */
const dayRecordArb: fc.Arbitrary<{ dayOfWeek: number; taskItems: TaskItem[] }> =
  fc.integer({ min: 0, max: 6 }).chain((dayOfWeek) =>
    fc.array(taskItemArb(1), { minLength: 0, maxLength: 10 }).map((taskItems) => ({
      dayOfWeek,
      taskItems,
    }))
  );

/** Arbitrary for an array of days (0 to 15 days). */
const daysArb = fc.array(dayRecordArb, { minLength: 0, maxLength: 15 });

/** Arbitrary for week items (task items for current or previous week). */
const weekItemsArb = fc.array(taskItemArb(1), { minLength: 0, maxLength: 20 });

describe('Property 11: Statistics calculator correctness', () => {
  /**
   * **Validates: Requirements 12.1**
   *
   * averageItemsPerDay should always be >= 0 for any input.
   */
  it('averageItemsPerDay is always >= 0', () => {
    fc.assert(
      fc.property(daysArb, weekItemsArb, weekItemsArb, (days, currentWeekItems, previousWeekItems) => {
        const result = calculateChecklistStats(days, currentWeekItems, previousWeekItems);
        expect(result.averageItemsPerDay).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 12.2**
   *
   * overallCompletionRate should always be between 0 and 100 (inclusive).
   */
  it('overallCompletionRate is always between 0 and 100', () => {
    fc.assert(
      fc.property(daysArb, weekItemsArb, weekItemsArb, (days, currentWeekItems, previousWeekItems) => {
        const result = calculateChecklistStats(days, currentWeekItems, previousWeekItems);
        expect(result.overallCompletionRate).toBeGreaterThanOrEqual(0);
        expect(result.overallCompletionRate).toBeLessThanOrEqual(100);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 12.4**
   *
   * currentWeekRate and previousWeekRate should always be between 0 and 100 (inclusive).
   */
  it('currentWeekRate and previousWeekRate are always between 0 and 100', () => {
    fc.assert(
      fc.property(daysArb, weekItemsArb, weekItemsArb, (days, currentWeekItems, previousWeekItems) => {
        const result = calculateChecklistStats(days, currentWeekItems, previousWeekItems);
        expect(result.currentWeekRate).toBeGreaterThanOrEqual(0);
        expect(result.currentWeekRate).toBeLessThanOrEqual(100);
        expect(result.previousWeekRate).toBeGreaterThanOrEqual(0);
        expect(result.previousWeekRate).toBeLessThanOrEqual(100);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 12.1, 12.2**
   *
   * hasSufficientData is true if and only if the number of days with items >= 7.
   */
  it('hasSufficientData is true iff days with items >= 7', () => {
    fc.assert(
      fc.property(daysArb, weekItemsArb, weekItemsArb, (days, currentWeekItems, previousWeekItems) => {
        const result = calculateChecklistStats(days, currentWeekItems, previousWeekItems);
        const daysWithItems = days.filter((d) => d.taskItems.length > 0).length;
        if (daysWithItems >= 7) {
          expect(result.hasSufficientData).toBe(true);
        } else {
          expect(result.hasSufficientData).toBe(false);
        }
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 12.3**
   *
   * mostProductiveDay is null when no days have items, otherwise is a valid day name.
   */
  it('mostProductiveDay is null when no days have items, otherwise is a valid day name', () => {
    fc.assert(
      fc.property(daysArb, weekItemsArb, weekItemsArb, (days, currentWeekItems, previousWeekItems) => {
        const result = calculateChecklistStats(days, currentWeekItems, previousWeekItems);
        const daysWithItems = days.filter((d) => d.taskItems.length > 0);
        if (daysWithItems.length === 0) {
          expect(result.mostProductiveDay).toBeNull();
        } else {
          expect(VALID_DAY_NAMES).toContain(result.mostProductiveDay);
        }
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 12.1**
   *
   * averageItemsPerDay equals totalItems / daysWithItems when daysWithItems > 0.
   */
  it('averageItemsPerDay equals totalItems / daysWithItems', () => {
    fc.assert(
      fc.property(daysArb, weekItemsArb, weekItemsArb, (days, currentWeekItems, previousWeekItems) => {
        const result = calculateChecklistStats(days, currentWeekItems, previousWeekItems);
        const daysWithItems = days.filter((d) => d.taskItems.length > 0);
        const totalItems = daysWithItems.reduce((sum, d) => sum + d.taskItems.length, 0);
        if (daysWithItems.length > 0) {
          expect(result.averageItemsPerDay).toBeCloseTo(totalItems / daysWithItems.length, 10);
        } else {
          expect(result.averageItemsPerDay).toBe(0);
        }
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 12.2**
   *
   * overallCompletionRate equals (completedItems / totalItems) * 100 when totalItems > 0.
   */
  it('overallCompletionRate equals (completedItems / totalItems) * 100', () => {
    fc.assert(
      fc.property(daysArb, weekItemsArb, weekItemsArb, (days, currentWeekItems, previousWeekItems) => {
        const result = calculateChecklistStats(days, currentWeekItems, previousWeekItems);
        const daysWithItems = days.filter((d) => d.taskItems.length > 0);
        const allItems = daysWithItems.flatMap((d) => d.taskItems);
        const completedItems = allItems.filter((item) => item.isComplete).length;
        if (allItems.length > 0) {
          const expected = (completedItems / allItems.length) * 100;
          expect(result.overallCompletionRate).toBeCloseTo(expected, 10);
        } else {
          expect(result.overallCompletionRate).toBe(0);
        }
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 12.4**
   *
   * currentWeekRate and previousWeekRate are computed correctly from their respective item arrays.
   */
  it('week rates are computed correctly from item arrays', () => {
    fc.assert(
      fc.property(daysArb, weekItemsArb, weekItemsArb, (days, currentWeekItems, previousWeekItems) => {
        const result = calculateChecklistStats(days, currentWeekItems, previousWeekItems);

        const expectedCurrentRate =
          currentWeekItems.length > 0
            ? (currentWeekItems.filter((item) => item.isComplete).length / currentWeekItems.length) * 100
            : 0;

        const expectedPreviousRate =
          previousWeekItems.length > 0
            ? (previousWeekItems.filter((item) => item.isComplete).length / previousWeekItems.length) * 100
            : 0;

        expect(result.currentWeekRate).toBeCloseTo(expectedCurrentRate, 10);
        expect(result.previousWeekRate).toBeCloseTo(expectedPreviousRate, 10);
      }),
      { numRuns: 20 }
    );
  });
});

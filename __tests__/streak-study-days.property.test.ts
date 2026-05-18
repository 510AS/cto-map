/**
 * Property-based tests for streak and study-day functions.
 *
 * Feature: cto-learning-helper
 * Properties 9, 10, 11
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 */

import * as fc from 'fast-check';
import {
  calculateStreak,
  calculateLongestStreak,
  countStudyDays,
} from '../lib/calculations';

// =============================================================================
// Helpers
// =============================================================================

/**
 * Converts a Date to a YYYY-MM-DD string using local date components.
 * Mirrors the internal helper in calculations.ts.
 */
function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the set of distinct calendar day strings from an array of timestamps.
 */
function getDistinctDays(timestamps: Date[]): Set<string> {
  const days = new Set<string>();
  for (const ts of timestamps) {
    days.add(toDateString(ts));
  }
  return days;
}

/**
 * Reference implementation: calculates the expected streak ending on `today`.
 * Counts consecutive calendar days backwards from today that appear in the set.
 */
function referenceStreak(timestamps: Date[], today: Date): number {
  const distinctDays = getDistinctDays(timestamps);
  const todayStr = toDateString(today);

  if (!distinctDays.has(todayStr)) {
    return 0;
  }

  let streak = 0;
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  while (distinctDays.has(toDateString(current))) {
    streak++;
    current.setDate(current.getDate() - 1);
  }

  return streak;
}

/**
 * Reference implementation: calculates the longest consecutive streak in the history.
 */
function referenceLongestStreak(timestamps: Date[]): number {
  const distinctDays = getDistinctDays(timestamps);
  if (distinctDays.size === 0) return 0;

  const sortedDays = Array.from(distinctDays).sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1] + 'T00:00:00');
    const curr = new Date(sortedDays[i] + 'T00:00:00');
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current++;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
  }

  return longest;
}

// =============================================================================
// Arbitraries
// =============================================================================

/**
 * Generates a Date within a reasonable range (2020-2030) to avoid edge cases
 * with extreme dates while still providing good coverage.
 */
const dateArb = fc.date({
  min: new Date(2020, 0, 1),
  max: new Date(2030, 11, 31),
});

/**
 * Generates an array of completion timestamps (0 to 50 entries).
 */
const timestampsArb = fc.array(dateArb, { minLength: 0, maxLength: 50 });

// =============================================================================
// Property 9: Streak Calculation
// =============================================================================

describe('Property 9: Streak Calculation', () => {
  /**
   * **Validates: Requirements 6.1, 6.2**
   *
   * For any set of completion timestamps T and today date,
   * calculateStreak(T, today) equals the length of the longest consecutive
   * sequence of calendar days ending on today where each day has at least
   * one timestamp in T.
   */
  it('should match reference consecutive-day logic for arbitrary timestamp sets', () => {
    fc.assert(
      fc.property(timestampsArb, dateArb, (timestamps, today) => {
        const actual = calculateStreak(timestamps, today);
        const expected = referenceStreak(timestamps, today);
        expect(actual).toBe(expected);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 6.2**
   *
   * If today has no completion timestamp, the streak must be 0.
   */
  it('should return zero streak when today has no completion', () => {
    fc.assert(
      fc.property(timestampsArb, dateArb, (timestamps, today) => {
        const todayStr = toDateString(today);
        const distinctDays = getDistinctDays(timestamps);

        if (!distinctDays.has(todayStr)) {
          expect(calculateStreak(timestamps, today)).toBe(0);
        }
      }),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 6.1**
   *
   * The streak is always non-negative.
   */
  it('should always return a non-negative streak value', () => {
    fc.assert(
      fc.property(timestampsArb, dateArb, (timestamps, today) => {
        expect(calculateStreak(timestamps, today)).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 10 }
    );
  });
});

// =============================================================================
// Property 10: Longest Streak Invariant
// =============================================================================

describe('Property 10: Longest Streak Invariant', () => {
  /**
   * **Validates: Requirements 6.3**
   *
   * For any completion history H, calculateLongestStreak(H) >= calculateStreak(H, today)
   * for all possible today values.
   */
  it('should satisfy longestStreak >= currentStreak for all H and today', () => {
    fc.assert(
      fc.property(timestampsArb, dateArb, (timestamps, today) => {
        const longestStreak = calculateLongestStreak(timestamps);
        const currentStreak = calculateStreak(timestamps, today);
        expect(longestStreak).toBeGreaterThanOrEqual(currentStreak);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 6.3**
   *
   * The longest streak matches the reference implementation.
   */
  it('should match reference longest streak calculation', () => {
    fc.assert(
      fc.property(timestampsArb, (timestamps) => {
        const actual = calculateLongestStreak(timestamps);
        const expected = referenceLongestStreak(timestamps);
        expect(actual).toBe(expected);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 6.3**
   *
   * The longest streak is always non-negative.
   */
  it('should always return a non-negative longest streak', () => {
    fc.assert(
      fc.property(timestampsArb, (timestamps) => {
        expect(calculateLongestStreak(timestamps)).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 10 }
    );
  });
});

// =============================================================================
// Property 11: Total Study Days Count
// =============================================================================

describe('Property 11: Total Study Days Count', () => {
  /**
   * **Validates: Requirements 6.4**
   *
   * For any set of completion timestamps T, countStudyDays(T) equals the
   * count of distinct calendar days (by local date) that appear in T.
   */
  it('should equal the distinct calendar-day count in the timestamps', () => {
    fc.assert(
      fc.property(timestampsArb, (timestamps) => {
        const actual = countStudyDays(timestamps);
        const expected = getDistinctDays(timestamps).size;
        expect(actual).toBe(expected);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 6.4**
   *
   * countStudyDays is always non-negative and at most the length of the input.
   */
  it('should be bounded: 0 <= countStudyDays(T) <= T.length', () => {
    fc.assert(
      fc.property(timestampsArb, (timestamps) => {
        const count = countStudyDays(timestamps);
        expect(count).toBeGreaterThanOrEqual(0);
        expect(count).toBeLessThanOrEqual(timestamps.length);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 6.4**
   *
   * Adding a duplicate timestamp on the same calendar day does not increase the count.
   */
  it('should not increase when adding a duplicate timestamp on the same day', () => {
    fc.assert(
      fc.property(
        timestampsArb.filter((ts) => ts.length > 0),
        fc.nat({ max: 49 }),
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 0, max: 59 }),
        (timestamps, indexSeed, hour, minute) => {
          const index = indexSeed % timestamps.length;
          const existingDate = timestamps[index];

          // Create a duplicate on the same calendar day with a specific time
          // Use the same year/month/day but different hour/minute
          const duplicate = new Date(
            existingDate.getFullYear(),
            existingDate.getMonth(),
            existingDate.getDate(),
            hour,
            minute,
            0,
            0
          );

          const originalCount = countStudyDays(timestamps);
          const withDuplicate = [...timestamps, duplicate];
          const newCount = countStudyDays(withDuplicate);

          expect(newCount).toBe(originalCount);
        }
      ),
      { numRuns: 10 }
    );
  });
});

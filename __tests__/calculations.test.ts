import * as fc from 'fast-check';
import { getCurrentWeekNumber } from '../lib/calculations';

/**
 * Property 3: Current Week Calculation
 * Validates: Requirements 2.4, 2.5
 *
 * For any start date S and current date C where C ≥ S,
 * getCurrentWeekNumber(S, C) SHALL equal min(ceil((diffInDays + 1) / 7), 52),
 * and the result SHALL always be in the range [1, 52].
 */
describe('Feature: cto-learning-helper, Property 3: Current Week Calculation', () => {
  it('should match the formula min(ceil((diffInDays + 1) / 7), 52) and clamp to [1, 52]', () => {
    fc.assert(
      fc.property(
        // Generate a start date timestamp and an offset where current >= start
        fc.integer({ min: 946684800000, max: 4102444800000 }), // valid timestamp range (2000-2100)
        fc.nat({ max: 365 * 5 }), // offset in days (0 to ~5 years)
        (startTimestamp, offsetDays) => {
          const startDate = new Date(startTimestamp);
          // Construct currentDate as startDate + offsetDays
          const currentDate = new Date(startTimestamp + offsetDays * 24 * 60 * 60 * 1000);

          const result = getCurrentWeekNumber(startDate, currentDate);

          // Calculate expected value using the formula
          const diffInMs = currentDate.getTime() - startDate.getTime();
          const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
          const expectedWeek = Math.min(Math.ceil((diffInDays + 1) / 7), 52);
          const expected = Math.max(1, expectedWeek);

          // Assert formula correctness
          expect(result).toBe(expected);

          // Assert range clamping [1, 52]
          expect(result).toBeGreaterThanOrEqual(1);
          expect(result).toBeLessThanOrEqual(52);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should return 1 when currentDate is before startDate', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 946684800000, max: 4102444800000 }), // valid timestamp range (2000-2100)
        fc.integer({ min: 1, max: 365 * 5 }), // negative offset in days
        (startTimestamp, offsetDays) => {
          const startDate = new Date(startTimestamp);
          // Construct currentDate as startDate - offsetDays (before start)
          const currentDate = new Date(startTimestamp - offsetDays * 24 * 60 * 60 * 1000);

          const result = getCurrentWeekNumber(startDate, currentDate);

          // When current < start, should return 1
          expect(result).toBe(1);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should always return a value in [1, 52] for any valid date pair', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 946684800000, max: 4102444800000 }), // valid timestamp range (2000-2100)
        fc.integer({ min: 946684800000, max: 4102444800000 }),
        (startTimestamp, currentTimestamp) => {
          const startDate = new Date(startTimestamp);
          const currentDate = new Date(currentTimestamp);

          const result = getCurrentWeekNumber(startDate, currentDate);

          // Result must always be in [1, 52] regardless of input
          expect(result).toBeGreaterThanOrEqual(1);
          expect(result).toBeLessThanOrEqual(52);
        }
      ),
      { numRuns: 10 }
    );
  });
});

import * as fc from 'fast-check';
import {
  overallCompletionPct,
  phaseCompletionPct,
  weekCompletionPct,
} from '../lib/calculations';

/**
 * Property 5: Completion Percentage Correctness
 *
 * Validates: Requirements 3.3, 5.2, 5.3, 4.4
 *
 * For any set of K completed weeks out of total, overallCompletionPct(K, total)
 * SHALL equal (K / total) * 100. Same formula applies to phaseCompletionPct
 * and weekCompletionPct. When total is 0, all functions return 0.
 */
describe('Property 5: Completion Percentage Correctness', () => {
  describe('overallCompletionPct', () => {
    it('returns exact formula (completed / total) * 100 for all non-negative integer inputs', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 1000 }),
          fc.nat({ max: 1000 }),
          (completed, total) => {
            const result = overallCompletionPct(completed, total);
            if (total === 0) {
              expect(result).toBe(0);
            } else {
              expect(result).toBe((completed / total) * 100);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('returns 0 when totalWeeks is 0', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 1000 }),
          (completed) => {
            expect(overallCompletionPct(completed, 0)).toBe(0);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('phaseCompletionPct', () => {
    it('returns exact formula (completed / total) * 100 for all non-negative integer inputs', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 1000 }),
          fc.nat({ max: 1000 }),
          (completedInPhase, totalInPhase) => {
            const result = phaseCompletionPct(completedInPhase, totalInPhase);
            if (totalInPhase === 0) {
              expect(result).toBe(0);
            } else {
              expect(result).toBe((completedInPhase / totalInPhase) * 100);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('returns 0 when totalWeeksInPhase is 0', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 1000 }),
          (completed) => {
            expect(phaseCompletionPct(completed, 0)).toBe(0);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('weekCompletionPct', () => {
    it('returns exact formula (completed / total) * 100 for all non-negative integer inputs', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 1000 }),
          fc.nat({ max: 1000 }),
          (completedDays, totalDays) => {
            const result = weekCompletionPct(completedDays, totalDays);
            if (totalDays === 0) {
              expect(result).toBe(0);
            } else {
              expect(result).toBe((completedDays / totalDays) * 100);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('returns 0 when totalDays is 0', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 1000 }),
          (completed) => {
            expect(weekCompletionPct(completed, 0)).toBe(0);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});

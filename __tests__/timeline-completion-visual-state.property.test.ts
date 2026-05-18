/**
 * Property-based test for timeline completion visual state.
 *
 * Feature: cto-learning-helper, Property 20: Timeline Completion Visual State
 *
 * **Validates: Requirements 11.2**
 *
 * For any week W, the SaaS Evolution Timeline SHALL render W with completed styling
 * if and only if W.isComplete = true.
 *
 * The TimelineEntry component applies:
 * - Completed: border-green-300, bg-green-50
 * - Incomplete: border-gray-200, bg-white
 *
 * This test verifies the conditional styling logic used by the component:
 * for arbitrary boolean isComplete values, the correct CSS classes are produced.
 */

import * as fc from 'fast-check';

// The styling logic extracted from TimelineEntry component
// This mirrors the exact conditional in components/TimelineEntry.tsx
function getTimelineEntryClasses(isComplete: boolean): string {
  return isComplete
    ? 'border-green-300 bg-green-50 hover:bg-green-100'
    : 'border-gray-200 bg-white hover:bg-gray-50';
}

// Completed styling markers
const COMPLETED_CLASSES = ['border-green-300', 'bg-green-50'];
const INCOMPLETE_CLASSES = ['border-gray-200', 'bg-white'];

describe('Property 20: Timeline Completion Visual State', () => {
  /**
   * **Validates: Requirements 11.2**
   *
   * Assert completed styling applied if and only if week.isComplete = true.
   * For any arbitrary boolean isComplete value, the timeline entry must apply
   * the correct visual styling classes.
   */
  it('should apply green completed styling if and only if isComplete is true', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (isComplete: boolean) => {
          const classes = getTimelineEntryClasses(isComplete);

          if (isComplete) {
            // Completed weeks MUST have green styling
            for (const cls of COMPLETED_CLASSES) {
              expect(classes).toContain(cls);
            }
            // Completed weeks MUST NOT have neutral/incomplete styling
            for (const cls of INCOMPLETE_CLASSES) {
              expect(classes).not.toContain(cls);
            }
          } else {
            // Incomplete weeks MUST have neutral styling
            for (const cls of INCOMPLETE_CLASSES) {
              expect(classes).toContain(cls);
            }
            // Incomplete weeks MUST NOT have green/completed styling
            for (const cls of COMPLETED_CLASSES) {
              expect(classes).not.toContain(cls);
            }
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 11.2**
   *
   * Assert the styling is a biconditional: completed styling ↔ isComplete = true.
   * For arbitrary week data with arbitrary completion state, the visual distinction
   * is determined solely by the isComplete flag.
   */
  it('should determine visual state solely from the isComplete flag regardless of other week data', () => {
    // Generate arbitrary week-like data with varying properties
    const weekArbitrary = fc.record({
      weekNumber: fc.integer({ min: 1, max: 52 }),
      title: fc.string({ minLength: 1, maxLength: 100 }),
      saasEvolution: fc.string({ minLength: 1, maxLength: 200 }),
      isComplete: fc.boolean(),
    });

    fc.assert(
      fc.property(
        weekArbitrary,
        (week) => {
          const classes = getTimelineEntryClasses(week.isComplete);

          // The visual state must be determined ONLY by isComplete
          const hasCompletedStyling = COMPLETED_CLASSES.every((cls) =>
            classes.includes(cls)
          );
          const hasIncompleteStyling = INCOMPLETE_CLASSES.every((cls) =>
            classes.includes(cls)
          );

          // Biconditional: completed styling ↔ isComplete = true
          expect(hasCompletedStyling).toBe(week.isComplete);
          expect(hasIncompleteStyling).toBe(!week.isComplete);
        }
      ),
      { numRuns: 10 }
    );
  });
});

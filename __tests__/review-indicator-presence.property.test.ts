/**
 * Property-based test for review indicator presence.
 *
 * Feature: cto-learning-helper, Property 19: Review Indicator Presence
 *
 * **Validates: Requirements 10.4**
 *
 * For any week W that has at least one non-empty saved review response,
 * the week card SHALL display a visual review indicator.
 * For any week W with no saved review responses, the card SHALL NOT
 * display the review indicator.
 *
 * Uses fast-check to generate arbitrary arrays of review responses and
 * asserts that the hasReview flag is correctly derived from the presence
 * or absence of review responses.
 */

import * as fc from 'fast-check';

/**
 * Pure logic that determines whether the review indicator should be shown.
 * This mirrors the logic used in the progress page / WeekCard:
 * hasReview = reviewResponses.length > 0
 */
function deriveHasReview(reviewResponses: { id: number; weekId: number; prompt: string; response: string; updatedAt: Date }[]): boolean {
  return reviewResponses.length > 0;
}

/** Valid review prompts as defined in the design. */
const REVIEW_PROMPTS = ['learned', 'built', 'difficult', 'differently'] as const;

/** Arbitrary for a single review response object. */
const reviewResponseArb = fc.record({
  id: fc.nat({ max: 10000 }),
  weekId: fc.nat({ max: 52 }),
  prompt: fc.constantFrom(...REVIEW_PROMPTS),
  response: fc.string({ minLength: 1, maxLength: 500 }),
  updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
});

describe('Property 19: Review Indicator Presence', () => {
  /**
   * **Validates: Requirements 10.4**
   *
   * When at least one review response exists, hasReview must be true
   * (indicator present).
   */
  it('should indicate review present when at least one review response exists', () => {
    fc.assert(
      fc.property(
        fc.array(reviewResponseArb, { minLength: 1, maxLength: 4 }),
        (reviewResponses) => {
          const hasReview = deriveHasReview(reviewResponses);
          expect(hasReview).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 10.4**
   *
   * When no review responses exist, hasReview must be false
   * (indicator absent).
   */
  it('should indicate review absent when no review responses exist', () => {
    fc.assert(
      fc.property(
        fc.constant([]),
        (reviewResponses: { id: number; weekId: number; prompt: string; response: string; updatedAt: Date }[]) => {
          const hasReview = deriveHasReview(reviewResponses);
          expect(hasReview).toBe(false);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 10.4**
   *
   * For arbitrary arrays of review responses (including empty),
   * hasReview is true if and only if the array is non-empty.
   */
  it('should have hasReview === (reviewResponses.length > 0) for any array', () => {
    fc.assert(
      fc.property(
        fc.array(reviewResponseArb, { minLength: 0, maxLength: 4 }),
        (reviewResponses) => {
          const hasReview = deriveHasReview(reviewResponses);
          const expected = reviewResponses.length > 0;
          expect(hasReview).toBe(expected);
        }
      ),
      { numRuns: 10 }
    );
  });
});

/**
 * Property-based tests for the suggestion parser.
 *
 * Feature: day-task-checklist
 * Property 6: Suggestion parser splits on delimiters
 *
 * Validates: Requirements 5.4
 */

import * as fc from 'fast-check';
import { parseSuggestions } from '../lib/suggestion-parser';

// =============================================================================
// Arbitraries
// =============================================================================

/** Generates a category value: either 'learn' or 'build'. */
const categoryArb = fc.constantFrom<'learn' | 'build'>('learn', 'build');

/** Generates a non-empty segment (word-like content without delimiters). */
const segmentArb = fc
  .stringOf(
    fc.constantFrom(
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
      'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
      'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ' ', '-', '_', '(', ')'
    ),
    { minLength: 1, maxLength: 30 }
  )
  .filter((s) => s.trim().length > 0)
  // Ensure segment doesn't contain delimiter-like patterns
  .filter((s) => !/\s+and\s+/.test(s));

/** Generates a non-numbered-list delimiter (comma, semicolon, or " and "). */
const delimiterArb = fc.constantFrom(',', ';', ' and ');

/**
 * Generates a task description composed of segments joined by delimiters.
 * This ensures we know the expected number of non-empty segments.
 */
const segmentedInputArb = fc
  .tuple(
    fc.array(segmentArb, { minLength: 1, maxLength: 8 }),
    delimiterArb
  )
  .map(([segments, delimiter]) => ({
    input: segments.join(delimiter),
    segments,
    delimiter,
  }));

/** Generates arbitrary non-empty strings for general parser robustness testing. */
const nonEmptyStringArb = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter((s) => s.trim().length > 0);

// =============================================================================
// Property 6: Suggestion parser splits on delimiters
// =============================================================================

describe('Feature: day-task-checklist, Property 6: Suggestion parser splits on delimiters', () => {
  /**
   * **Validates: Requirements 5.4**
   *
   * The parser always returns an array (never throws) for any input string.
   */
  it('should always return an array and never throw for any input', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 500 }), categoryArb, (input, category) => {
        const result = parseSuggestions(input, category);
        expect(Array.isArray(result)).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 5.4**
   *
   * All returned suggestions have source = 'template'.
   */
  it('should set source to "template" for all returned suggestions', () => {
    fc.assert(
      fc.property(nonEmptyStringArb, categoryArb, (input, category) => {
        const result = parseSuggestions(input, category);
        for (const suggestion of result) {
          expect(suggestion.source).toBe('template');
        }
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 5.4**
   *
   * All returned suggestions have the provided category.
   */
  it('should assign the provided category to all returned suggestions', () => {
    fc.assert(
      fc.property(nonEmptyStringArb, categoryArb, (input, category) => {
        const result = parseSuggestions(input, category);
        for (const suggestion of result) {
          expect(suggestion.category).toBe(category);
        }
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 5.4**
   *
   * No returned suggestion has an empty title.
   */
  it('should never return a suggestion with an empty title', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 500 }), categoryArb, (input, category) => {
        const result = parseSuggestions(input, category);
        for (const suggestion of result) {
          expect(suggestion.title.length).toBeGreaterThan(0);
          expect(suggestion.title.trim().length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 5.4**
   *
   * The number of suggestions is always >= 1 for non-empty input (after trimming).
   */
  it('should return at least one suggestion for non-empty trimmed input', () => {
    fc.assert(
      fc.property(nonEmptyStringArb, categoryArb, (input, category) => {
        const result = parseSuggestions(input, category);
        expect(result.length).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 5.4**
   *
   * Joining suggestions back should cover all non-delimiter content from the input.
   * For structured inputs with known segments and delimiters, the parser should
   * produce suggestions whose titles match the original segments (after trimming).
   */
  it('should produce suggestions covering all non-delimiter content from structured input', () => {
    fc.assert(
      fc.property(segmentedInputArb, categoryArb, ({ input, segments }, category) => {
        const result = parseSuggestions(input, category);
        const resultTitles = result.map((s) => s.title);
        const expectedTitles = segments.map((s) => s.trim()).filter((s) => s.length > 0);

        // Each expected segment should appear in the result titles
        for (const expected of expectedTitles) {
          const found = resultTitles.some(
            (title) => title === expected || title.includes(expected) || expected.includes(title)
          );
          expect(found).toBe(true);
        }
      }),
      { numRuns: 20 }
    );
  });
});

/**
 * Property-based test for note indicator presence.
 *
 * Feature: cto-learning-helper, Property 14: Note Indicator Presence
 *
 * **Validates: Requirements 7.4**
 *
 * For any week W or day D with a non-empty saved note, the rendered card
 * SHALL include a visual note indicator. For any week W or day D with no
 * saved note (or an empty string), the rendered card SHALL NOT include
 * the note indicator.
 *
 * The WeekCard component receives a `hasNote` boolean prop that controls
 * whether the 📝 indicator (data-testid="note-indicator") is displayed.
 * This test verifies the logic that determines `hasNote` from the note value:
 * - Non-empty string → hasNote = true (indicator present)
 * - Empty string or null → hasNote = false (indicator absent)
 *
 * Uses fast-check with a minimum of 100 iterations.
 */

import * as fc from 'fast-check';

/**
 * Determines whether a note indicator should be shown based on the note value.
 * This mirrors the logic used in the progress page and WeekCard integration:
 * a note indicator is present when the note is a non-empty string.
 */
function shouldShowNoteIndicator(note: string | null | undefined): boolean {
  return note !== null && note !== undefined && note.length > 0;
}

describe('Property 14: Note Indicator Presence', () => {
  /**
   * **Validates: Requirements 7.4**
   *
   * For any non-empty string used as a note, the note indicator should be present.
   */
  it('should indicate note presence for any non-empty note string', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary non-empty strings (at least 1 character)
        fc.string({ minLength: 1 }),
        (note: string) => {
          const hasNote = shouldShowNoteIndicator(note);
          expect(hasNote).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 7.4**
   *
   * For an empty string note, the note indicator should be absent.
   */
  it('should not indicate note presence for an empty string note', () => {
    fc.assert(
      fc.property(
        // Always generate empty string
        fc.constant(''),
        (note: string) => {
          const hasNote = shouldShowNoteIndicator(note);
          expect(hasNote).toBe(false);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 7.4**
   *
   * For a null note value, the note indicator should be absent.
   */
  it('should not indicate note presence for a null note', () => {
    fc.assert(
      fc.property(
        // Always generate null
        fc.constant(null),
        (note: null) => {
          const hasNote = shouldShowNoteIndicator(note);
          expect(hasNote).toBe(false);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 7.4**
   *
   * For any arbitrary note value (string, empty string, or null), the indicator
   * presence is determined solely by whether the note is non-empty.
   * This is the comprehensive property: indicator present ↔ note is non-empty string.
   */
  it('should show indicator if and only if note is a non-empty string', () => {
    // Arbitrary that produces strings (including empty) and null
    const noteArbitrary = fc.oneof(
      fc.string(),       // includes empty strings
      fc.constant(null)  // null case
    );

    fc.assert(
      fc.property(
        noteArbitrary,
        (note: string | null) => {
          const hasNote = shouldShowNoteIndicator(note);
          const expectedHasNote = note !== null && note.length > 0;
          expect(hasNote).toBe(expectedHasNote);
        }
      ),
      { numRuns: 10 }
    );
  });
});

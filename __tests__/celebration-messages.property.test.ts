/**
 * Property-based test for celebration message membership.
 *
 * Feature: day-task-checklist, Property 10: Celebration message membership
 *
 * **Validates: Requirements 11.4**
 *
 * The CELEBRATION_MESSAGES array exported from CompletionCelebration.tsx has at
 * least 5 messages, and any randomly selected index (0 to length-1) produces a
 * valid non-empty string from the array.
 */

import * as fc from 'fast-check';
import { CELEBRATION_MESSAGES } from '../lib/celebration-messages';

// =============================================================================
// Property 10: Celebration message membership
// =============================================================================

describe('Property 10: Celebration message membership', () => {
  /**
   * **Validates: Requirements 11.4**
   *
   * The predefined message set contains at least 5 messages.
   */
  it('CELEBRATION_MESSAGES contains at least 5 messages', () => {
    expect(CELEBRATION_MESSAGES.length).toBeGreaterThanOrEqual(5);
  });

  /**
   * **Validates: Requirements 11.4**
   *
   * For any valid index (0 to length-1), the selected message is a non-empty
   * string that is a member of the CELEBRATION_MESSAGES array.
   */
  it('any valid index into CELEBRATION_MESSAGES produces a non-empty string member', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: CELEBRATION_MESSAGES.length - 1 }),
        (index) => {
          const message = CELEBRATION_MESSAGES[index];

          // The message must be a string
          expect(typeof message).toBe('string');

          // The message must be non-empty (after trimming)
          expect(message.trim().length).toBeGreaterThan(0);

          // The message must be a member of the predefined set
          expect(CELEBRATION_MESSAGES).toContain(message);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 11.4**
   *
   * Simulating random selection (as the component does with Math.floor(Math.random() * length))
   * always yields a valid member of the predefined set.
   */
  it('simulated random selection always yields a valid message from the set', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }).filter((v) => v < 1),
        (randomValue) => {
          const index = Math.floor(randomValue * CELEBRATION_MESSAGES.length);
          const message = CELEBRATION_MESSAGES[index];

          // The selected message must be a non-empty string
          expect(typeof message).toBe('string');
          expect(message.trim().length).toBeGreaterThan(0);

          // The selected message must be a member of the predefined set
          expect(CELEBRATION_MESSAGES).toContain(message);
        }
      ),
      { numRuns: 20 }
    );
  });
});

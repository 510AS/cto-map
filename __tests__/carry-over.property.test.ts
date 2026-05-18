/**
 * Property-based tests for carry-over preservation.
 *
 * Feature: day-task-checklist, Property 9: Carry-over preserves item data
 *
 * **Validates: Requirements 9.3**
 *
 * For any incomplete task item from a previous day, when carried over as a suggestion,
 * the suggestion should preserve the original item's title, category, and note (as sourceNote).
 */

import * as fc from 'fast-check';
import { TaskItem, TaskItemSuggestion } from '../lib/types';

// =============================================================================
// Pure carry-over transformation function
// =============================================================================

/**
 * Transforms incomplete TaskItems from a previous day into carry-over suggestions.
 * This mirrors the logic in app/api/task-items/suggestions/route.ts.
 */
function transformToCarryOverSuggestions(incompleteItems: TaskItem[]): TaskItemSuggestion[] {
  return incompleteItems.map((item) => ({
    title: item.title,
    category: item.category,
    source: 'carry-over' as const,
    sourceNote: item.note,
  }));
}

// =============================================================================
// Generators
// =============================================================================

/** Generate a non-empty title string (no pure whitespace). */
const titleArb = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);

/** Generate a valid category. */
const categoryArb = fc.constantFrom('learn' as const, 'build' as const);

/** Generate an optional note (null or non-empty string up to 500 chars). */
const noteArb = fc.oneof(
  fc.constant(null),
  fc.string({ minLength: 1, maxLength: 500 })
);

/** Generate an incomplete TaskItem (isComplete = false). */
const incompleteTaskItemArb = fc.record({
  id: fc.nat({ max: 10000 }),
  title: titleArb,
  category: categoryArb,
  isComplete: fc.constant(false),
  sortOrder: fc.nat({ max: 100 }),
  timeEstimate: fc.oneof(fc.constant(null), fc.integer({ min: 1, max: 480 })),
  note: noteArb,
  createdAt: fc.constant(new Date().toISOString()),
  dayId: fc.nat({ max: 1000 }),
});

// =============================================================================
// Property Tests
// =============================================================================

describe('Property 9: Carry-over preserves item data', () => {
  /**
   * **Validates: Requirements 9.3**
   *
   * When incomplete items from a previous day are carried over as suggestions,
   * the suggestion preserves the original item's title, category, and note (as sourceNote).
   */
  it('carry-over suggestion preserves title, category, and note from the source item', () => {
    fc.assert(
      fc.property(
        incompleteTaskItemArb,
        (item) => {
          const suggestions = transformToCarryOverSuggestions([item]);

          expect(suggestions).toHaveLength(1);
          const suggestion = suggestions[0];

          // Title is preserved exactly
          expect(suggestion.title).toBe(item.title);
          // Category is preserved exactly
          expect(suggestion.category).toBe(item.category);
          // Note is preserved as sourceNote
          expect(suggestion.sourceNote).toBe(item.note);
          // Source is marked as carry-over
          expect(suggestion.source).toBe('carry-over');
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * For any list of incomplete items, all items are transformed into suggestions
   * preserving their data.
   */
  it('all incomplete items in a batch are preserved as carry-over suggestions', () => {
    fc.assert(
      fc.property(
        fc.array(incompleteTaskItemArb, { minLength: 1, maxLength: 20 }),
        (items) => {
          const suggestions = transformToCarryOverSuggestions(items);

          expect(suggestions).toHaveLength(items.length);

          for (let i = 0; i < items.length; i++) {
            expect(suggestions[i].title).toBe(items[i].title);
            expect(suggestions[i].category).toBe(items[i].category);
            expect(suggestions[i].sourceNote).toBe(items[i].note);
            expect(suggestions[i].source).toBe('carry-over');
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});

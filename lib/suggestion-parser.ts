import { TaskItemSuggestion } from './types';

/**
 * Parses a task description into suggested sub-task items by splitting
 * on common delimiters: commas (not inside parentheses), semicolons,
 * " and " conjunctions, and numbered list patterns (e.g., "1. ", "2. ").
 *
 * Enhancement #10:
 * - Filters out suggestions shorter than 10 characters
 * - Limits to max 5 suggestions per category
 * - Doesn't split on commas inside parentheses
 * - Trims leading articles ("the", "a", "an")
 */
export function parseSuggestions(
  taskDescription: string,
  category: 'learn' | 'build'
): TaskItemSuggestion[] {
  if (!taskDescription || !taskDescription.trim()) {
    return [];
  }

  // First, split on numbered list patterns (e.g., "1. ", "2. ", "10. ")
  const numberedListPattern = /\d+\.\s+/;
  let segments: string[];

  if (numberedListPattern.test(taskDescription)) {
    // Split by numbered list pattern, removing the number prefixes
    segments = taskDescription.split(/\d+\.\s+/);
  } else {
    // Split on semicolons first
    segments = taskDescription.split(/;/);

    // Then split on commas, but NOT inside parentheses
    segments = segments.flatMap((part) => splitOutsideParentheses(part, ','));

    // Then split on " and " conjunctions
    segments = segments.flatMap((part) => part.split(/\s+and\s+/));
  }

  const results = segments
    .map((segment) => segment.trim())
    .map((segment) => trimLeadingArticle(segment))
    .filter((segment) => segment.length >= 10) // Filter out short suggestions
    .map((title) => ({
      title,
      category,
      source: 'template' as const,
    }));

  // Limit to max 5 suggestions per category
  return results.slice(0, 5);
}

/**
 * Splits a string by a delimiter, but only when the delimiter
 * is NOT inside parentheses.
 */
function splitOutsideParentheses(text: string, delimiter: string): string[] {
  const results: string[] = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '(') {
      depth++;
      current += char;
    } else if (char === ')') {
      depth = Math.max(0, depth - 1);
      current += char;
    } else if (char === delimiter && depth === 0) {
      results.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  if (current) {
    results.push(current);
  }

  return results;
}

/**
 * Trims leading articles ("the", "a", "an") from a suggestion.
 */
function trimLeadingArticle(text: string): string {
  return text.replace(/^(the|a|an)\s+/i, '');
}

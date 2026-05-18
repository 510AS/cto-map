/**
 * Pure completion calculator for the Day Task Checklist feature.
 *
 * Derives day-level completion from individual task item states.
 * When all items in a category are complete, the parent category is set to true.
 * When both categories are complete, the day itself is marked complete.
 *
 * If a category has zero items, the existing completion state is preserved.
 */

import { TaskItem } from './types';

export interface DayCompletionResult {
  learnComplete: boolean;
  buildComplete: boolean;
  isComplete: boolean;
}

export interface ExistingCompletionState {
  learnComplete: boolean;
  buildComplete: boolean;
}

/**
 * Calculates day completion from task item states.
 *
 * - learnComplete = true iff all items with category "learn" are complete
 * - buildComplete = true iff all items with category "build" are complete
 * - isComplete = learnComplete AND buildComplete
 *
 * When a category has zero items, the existing completion state for that
 * category is preserved (defaults to false if no existing state is provided).
 */
export function calculateDayCompletion(
  taskItems: TaskItem[],
  existingState: ExistingCompletionState = { learnComplete: false, buildComplete: false }
): DayCompletionResult {
  const learnItems = taskItems.filter((item) => item.category === 'learn');
  const buildItems = taskItems.filter((item) => item.category === 'build');

  const learnComplete =
    learnItems.length > 0
      ? learnItems.every((item) => item.isComplete)
      : existingState.learnComplete;

  const buildComplete =
    buildItems.length > 0
      ? buildItems.every((item) => item.isComplete)
      : existingState.buildComplete;

  const isComplete = learnComplete && buildComplete;

  return { learnComplete, buildComplete, isComplete };
}

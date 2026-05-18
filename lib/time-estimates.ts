import { TaskItem } from './types';

/**
 * Calculate time estimates for a set of task items.
 *
 * - totalMinutes: sum of all non-null timeEstimate values
 * - remainingMinutes: sum of non-null timeEstimate values for incomplete items only
 *
 * Items with null timeEstimate do not contribute to any sum.
 */
export function calculateTimeEstimates(items: TaskItem[]): {
  totalMinutes: number;
  remainingMinutes: number;
} {
  let totalMinutes = 0;
  let remainingMinutes = 0;

  for (const item of items) {
    if (item.timeEstimate != null) {
      totalMinutes += item.timeEstimate;
      if (!item.isComplete) {
        remainingMinutes += item.timeEstimate;
      }
    }
  }

  return { totalMinutes, remainingMinutes };
}

import { TaskItem, ChecklistStatsResponse } from './types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Calculate checklist statistics from task item data.
 *
 * @param days - Array of day records with dayOfWeek (0=Sunday..6=Saturday) and their taskItems
 * @param currentWeekItems - All task items from the current week
 * @param previousWeekItems - All task items from the previous week
 * @returns ChecklistStatsResponse with computed statistics
 */
export function calculateChecklistStats(
  days: Array<{ dayOfWeek: number; taskItems: TaskItem[] }>,
  currentWeekItems: TaskItem[],
  previousWeekItems: TaskItem[]
): ChecklistStatsResponse {
  // Filter to only days that have checklist items
  const daysWithItems = days.filter((d) => d.taskItems.length > 0);
  const totalDays = daysWithItems.length;

  // Requirement 12.5: insufficient data when fewer than 7 days
  const hasSufficientData = totalDays >= 7;

  // Collect all task items across all days
  const allItems = daysWithItems.flatMap((d) => d.taskItems);
  const totalItems = allItems.length;
  const completedItems = allItems.filter((item) => item.isComplete).length;

  // Requirement 12.1: average items per day
  const averageItemsPerDay = totalDays > 0 ? totalItems / totalDays : 0;

  // Requirement 12.2: overall completion rate
  const overallCompletionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  // Requirement 12.3: most productive day of the week
  const mostProductiveDay = calculateMostProductiveDay(daysWithItems);

  // Requirement 12.4: current and previous week rates for trend
  const currentWeekRate =
    currentWeekItems.length > 0
      ? (currentWeekItems.filter((item) => item.isComplete).length / currentWeekItems.length) * 100
      : 0;

  const previousWeekRate =
    previousWeekItems.length > 0
      ? (previousWeekItems.filter((item) => item.isComplete).length / previousWeekItems.length) * 100
      : 0;

  return {
    averageItemsPerDay,
    overallCompletionRate,
    mostProductiveDay,
    currentWeekRate,
    previousWeekRate,
    hasSufficientData,
  };
}

/**
 * Determine the most productive day of the week based on highest average completed items.
 * Groups days by dayOfWeek, calculates average completed items per day-of-week,
 * and returns the name of the day with the highest average.
 */
function calculateMostProductiveDay(
  daysWithItems: Array<{ dayOfWeek: number; taskItems: TaskItem[] }>
): string | null {
  if (daysWithItems.length === 0) {
    return null;
  }

  // Group by dayOfWeek and accumulate completed counts
  const dayStats = new Map<number, { totalCompleted: number; count: number }>();

  for (const day of daysWithItems) {
    const completed = day.taskItems.filter((item) => item.isComplete).length;
    const existing = dayStats.get(day.dayOfWeek);
    if (existing) {
      existing.totalCompleted += completed;
      existing.count += 1;
    } else {
      dayStats.set(day.dayOfWeek, { totalCompleted: completed, count: 1 });
    }
  }

  // Find the day of week with the highest average completed items
  let bestDay: number | null = null;
  let bestAverage = -1;

  for (const [dayOfWeek, stats] of dayStats) {
    const average = stats.totalCompleted / stats.count;
    if (average > bestAverage) {
      bestAverage = average;
      bestDay = dayOfWeek;
    }
  }

  return bestDay !== null ? DAY_NAMES[bestDay] : null;
}

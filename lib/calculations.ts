/**
 * Pure calculation functions for the CTO Learning Helper.
 *
 * All functions in this module are pure — no side effects, no database access.
 * They operate solely on their inputs and return deterministic results.
 */

/**
 * Returns the current week number (1–52) given a start date and today's date.
 * Formula: Math.ceil((diffInDays + 1) / 7), clamped to [1, 52].
 *
 * If currentDate is before startDate, returns 1.
 */
export function getCurrentWeekNumber(startDate: Date, currentDate: Date): number {
  const diffInMs = currentDate.getTime() - startDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) {
    return 1;
  }

  const weekNumber = Math.ceil((diffInDays + 1) / 7);
  return Math.max(1, Math.min(weekNumber, 52));
}

/**
 * Returns the current streak: consecutive calendar days ending on today
 * where at least one completion timestamp exists.
 *
 * If today has no completion, the streak is 0.
 */
export function calculateStreak(completionTimestamps: Date[], today: Date): number {
  if (completionTimestamps.length === 0) {
    return 0;
  }

  // Get distinct calendar days from timestamps
  const distinctDays = getDistinctCalendarDays(completionTimestamps);

  // Check if today has a completion
  const todayStr = toDateString(today);
  if (!distinctDays.has(todayStr)) {
    return 0;
  }

  // Count consecutive days backwards from today
  let streak = 0;
  let currentDate = new Date(today);

  while (true) {
    const dateStr = toDateString(currentDate);
    if (distinctDays.has(dateStr)) {
      streak++;
      // Move to previous day
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Returns the longest consecutive day streak in the completion history.
 *
 * If there are no completions, returns 0.
 */
export function calculateLongestStreak(completionTimestamps: Date[]): number {
  if (completionTimestamps.length === 0) {
    return 0;
  }

  // Get distinct calendar days and sort them
  const distinctDays = getDistinctCalendarDays(completionTimestamps);
  const sortedDays = Array.from(distinctDays).sort();

  if (sortedDays.length === 0) {
    return 0;
  }

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const prevDate = new Date(sortedDays[i - 1]);
    const currDate = new Date(sortedDays[i]);

    // Check if dates are consecutive (differ by exactly 1 day)
    const diffMs = currDate.getTime() - prevDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
    } else {
      currentStreak = 1;
    }

    longestStreak = Math.max(longestStreak, currentStreak);
  }

  return longestStreak;
}

/**
 * Returns the count of distinct calendar days with at least one completion.
 */
export function countStudyDays(completionTimestamps: Date[]): number {
  return getDistinctCalendarDays(completionTimestamps).size;
}

/**
 * Returns overall curriculum completion percentage (0–100).
 * Formula: (completedWeeks / totalWeeks) * 100
 *
 * If totalWeeks is 0, returns 0.
 */
export function overallCompletionPct(completedWeeks: number, totalWeeks: number): number {
  if (totalWeeks === 0) {
    return 0;
  }
  return (completedWeeks / totalWeeks) * 100;
}

/**
 * Returns per-phase completion percentage (0–100).
 * Formula: (completedWeeksInPhase / totalWeeksInPhase) * 100
 *
 * If totalWeeksInPhase is 0, returns 0.
 */
export function phaseCompletionPct(completedWeeksInPhase: number, totalWeeksInPhase: number): number {
  if (totalWeeksInPhase === 0) {
    return 0;
  }
  return (completedWeeksInPhase / totalWeeksInPhase) * 100;
}

/**
 * Returns per-week completion percentage (0–100).
 * Formula: (completedDays / totalDays) * 100
 *
 * If totalDays is 0, returns 0.
 */
export function weekCompletionPct(completedDays: number, totalDays: number): number {
  if (totalDays === 0) {
    return 0;
  }
  return (completedDays / totalDays) * 100;
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Converts a Date to a YYYY-MM-DD string using local date components.
 */
function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns a Set of distinct calendar day strings (YYYY-MM-DD) from an array of timestamps.
 */
function getDistinctCalendarDays(timestamps: Date[]): Set<string> {
  const days = new Set<string>();
  for (const ts of timestamps) {
    days.add(toDateString(ts));
  }
  return days;
}

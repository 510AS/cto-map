import { StreakBadgeProps } from '@/lib/types';

/**
 * StreakBadge with dark mode support.
 */
export default function StreakBadge({ currentStreak, longestStreak }: StreakBadgeProps) {
  const getMessage = () => {
    if (currentStreak >= 30) return "Unstoppable! 🏆";
    if (currentStreak >= 14) return "On fire! 🔥";
    if (currentStreak >= 7) return "Great momentum!";
    if (currentStreak >= 3) return "Building habits!";
    if (currentStreak >= 1) return "Keep going!";
    return "Start today!";
  };

  return (
    <div className="card p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-orange-200 dark:border-orange-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
            <span className="text-xl" role="img" aria-label="fire">🔥</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{currentStreak}</p>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Day Streak</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-orange-700 dark:text-orange-300">{longestStreak}</p>
          <p className="text-xs text-orange-500 dark:text-orange-400">Best</p>
        </div>
      </div>
      <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">{getMessage()}</p>
    </div>
  );
}

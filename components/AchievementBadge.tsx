'use client';

interface AchievementBadgeProps {
  icon: string;
  name: string;
  description?: string;
  earned: boolean;
  earnedAt?: string;
}

/**
 * Displays a single achievement badge.
 * Earned badges are colored, unearned are gray.
 */
export default function AchievementBadge({ icon, name, description, earned, earnedAt }: AchievementBadgeProps) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
        earned
          ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/50'
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-50 grayscale'
      }`}
      title={earned && earnedAt ? `Earned: ${new Date(earnedAt).toLocaleDateString()}` : 'Not yet earned'}
    >
      <span className="text-2xl">{icon}</span>
      <span className={`text-xs font-medium text-center ${
        earned ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
      }`}>
        {name}
      </span>
      {description && (
        <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center leading-tight">
          {description}
        </span>
      )}
    </div>
  );
}

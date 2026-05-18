import { ProgressBarProps } from '@/lib/types';

/**
 * ProgressBar with gradient colors and dark mode support.
 */
export default function ProgressBar({ percentage, label }: ProgressBarProps) {
  const clampedPct = Math.max(0, Math.min(100, percentage));
  // Show at least 1% visually when there's any progress
  const displayPct = clampedPct > 0 && clampedPct < 1 ? 1 : Math.round(clampedPct);
  const barWidth = clampedPct > 0 && clampedPct < 1 ? 1 : clampedPct;

  const getGradient = () => {
    if (displayPct >= 80) return 'from-green-500 to-emerald-500';
    if (displayPct >= 50) return 'from-blue-500 to-indigo-500';
    if (displayPct >= 25) return 'from-amber-500 to-orange-500';
    return 'from-gray-400 to-gray-500';
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span className={`text-sm font-bold ${
            displayPct >= 80 ? 'text-green-600 dark:text-green-400' :
            displayPct >= 50 ? 'text-blue-600 dark:text-blue-400' :
            'text-gray-600 dark:text-gray-400'
          }`}>
            {displayPct}%
          </span>
        </div>
      )}
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
        <div
          className={`bg-gradient-to-r ${getGradient()} h-3 rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${barWidth}%` }}
          role="progressbar"
          aria-valuenow={displayPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label ?? `${displayPct}% complete`}
        />
      </div>
    </div>
  );
}

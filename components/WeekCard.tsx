import Link from 'next/link';
import { WeekCardProps } from '@/lib/types';

/**
 * WeekCard displays a summary card for a single week in the progress overview.
 * Shows week number, title, completion percentage, tags, and visual indicators
 * for notes and reviews. Links to the week detail page.
 */
export default function WeekCard({ week, completionPct, hasNote, hasReview }: WeekCardProps) {
  const roundedPct = Math.round(Math.max(0, Math.min(100, completionPct)));

  return (
    <Link
      href={`/week/${week.weekNumber}`}
      className="block min-h-[44px] rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all bg-white"
      aria-label={`Week ${week.weekNumber}: ${week.title}, ${roundedPct}% complete`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 rounded px-2 py-0.5">
            W{week.weekNumber}
          </span>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{week.title}</h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {hasNote && (
            <span
              className="text-amber-500"
              role="img"
              aria-label="Has note"
              data-testid="note-indicator"
            >
              📝
            </span>
          )}
          {hasReview && (
            <span
              className="text-purple-500"
              role="img"
              aria-label="Has review"
              data-testid="review-indicator"
            >
              ✍️
            </span>
          )}
        </div>
      </div>

      {/* Completion bar */}
      <div className="mt-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">
            {roundedPct}% complete
          </span>
          {week.isComplete && (
            <span className="text-xs font-medium text-green-600">✓ Done</span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${roundedPct}%` }}
            role="progressbar"
            aria-valuenow={roundedPct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Tags */}
      {week.tags && week.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {week.tags.map((weekTag) => (
            <span
              key={weekTag.tagId}
              className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5"
            >
              {weekTag.tag?.name}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

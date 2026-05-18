'use client';

import Link from 'next/link';
import { TimelineEntryProps } from '@/lib/types';

/**
 * TimelineEntry renders a single week entry in the SaaS Evolution Timeline.
 * Shows the week number, title, SaaS evolution note, and visually distinguishes
 * completed vs incomplete weeks. Clicking navigates to the week detail page.
 */
export default function TimelineEntry({ week, isComplete }: TimelineEntryProps) {
  return (
    <Link
      href={`/week/${week.weekNumber}`}
      className={`block min-h-[44px] min-w-[44px] p-4 rounded-lg border transition-colors duration-200 ${
        isComplete
          ? 'border-green-300 bg-green-50 hover:bg-green-100'
          : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}
      aria-label={`Week ${week.weekNumber}: ${week.title}${isComplete ? ' (completed)' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Completion indicator */}
        <div className="flex-shrink-0 mt-0.5">
          {isComplete ? (
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white"
              aria-hidden="true"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </span>
          ) : (
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-400"
              aria-hidden="true"
            >
              <span className="w-2 h-2 rounded-full bg-gray-400" />
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                isComplete
                  ? 'bg-green-200 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Week {week.weekNumber}
            </span>
            <h3
              className={`text-sm font-medium truncate ${
                isComplete ? 'text-green-900' : 'text-gray-900'
              }`}
            >
              {week.title}
            </h3>
          </div>
          <p
            className={`text-sm leading-relaxed ${
              isComplete ? 'text-green-700' : 'text-gray-600'
            }`}
          >
            {week.saasEvolution}
          </p>
        </div>
      </div>
    </Link>
  );
}

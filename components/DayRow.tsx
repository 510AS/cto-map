"use client";

import Link from "next/link";
import { DayRowProps } from "@/lib/types";

/**
 * DayRow renders a single day as a clickable card that links to the day detail page.
 * Enhancement #4: Shows sub-task progress, confidence stars, reflection icon.
 */
export default function DayRow({ day, onToggleComplete }: DayRowProps) {
  const isSkipped = (day as any).skipped;
  const confidence = (day as any).confidence as number | null | undefined;
  const reflection = (day as any).reflection as string | null | undefined;
  const taskItems = (day as any).taskItems as Array<{ isComplete: boolean }> | undefined;
  const learnDone = day.learnComplete ?? day.isComplete;
  const buildDone = day.buildComplete ?? day.isComplete;

  const bothComplete = learnDone && buildDone;
  const partialComplete = learnDone || buildDone;

  // Enhancement #4: Sub-task progress count
  const totalSubTasks = taskItems?.length ?? 0;
  const completedSubTasks = taskItems?.filter((t) => t.isComplete).length ?? 0;

  // Get weekNumber from the day's week relation if available
  const weekNumber = (day as any).week?.weekNumber;
  const href = weekNumber
    ? `/week/${weekNumber}/day/${day.sortOrder}`
    : `#`;

  if (isSkipped) {
    return (
      <Link
        href={href}
        className="block rounded-xl border-2 border-gray-200 dark:border-gray-700 transition-all duration-200 overflow-hidden opacity-50"
        data-testid={`day-row-${day.id}`}
      >
        <div className="px-4 py-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400 line-through">{day.dayLabel}</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
                Skipped
              </span>
            </div>
            <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`block rounded-xl border-2 transition-all duration-200 overflow-hidden hover:shadow-md ${
        bothComplete
          ? "border-green-200 dark:border-green-800"
          : partialComplete
          ? "border-blue-200 dark:border-blue-800"
          : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
      }`}
      data-testid={`day-row-${day.id}`}
    >
      <div className={`px-4 py-4 ${
        bothComplete ? "bg-green-50 dark:bg-green-950" : partialComplete ? "bg-blue-50/50 dark:bg-blue-950/50" : "bg-white dark:bg-gray-900"
      }`}>
        {/* Top row: day label + status + indicators */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${
              bothComplete ? "text-green-800 dark:text-green-200" : "text-gray-900 dark:text-gray-100"
            }`}>
              {day.dayLabel}
            </span>
            {bothComplete && (
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                ✓ Complete
              </span>
            )}
            {partialComplete && !bothComplete && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                In Progress
              </span>
            )}
            {/* Enhancement #4: Confidence stars */}
            {confidence && confidence > 0 && (
              <span className="text-xs text-yellow-500 ml-1" title={`Confidence: ${confidence}/5`}>
                {'★'.repeat(Math.min(confidence, 5))}
              </span>
            )}
            {/* Enhancement #4: Reflection icon */}
            {reflection && (
              <span className="text-xs" title="Has reflection">📝</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Enhancement #4: Sub-task progress */}
            {totalSubTasks > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {completedSubTasks}/{totalSubTasks}
              </span>
            )}
            <div className="flex items-center gap-1">
              <div className={`w-2.5 h-2.5 rounded-full ${learnDone ? "bg-purple-500" : "bg-gray-300 dark:bg-gray-600"}`} />
              <div className={`w-2.5 h-2.5 rounded-full ${buildDone ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`} />
            </div>
            <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Task previews */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-xs mt-0.5 shrink-0">📖</span>
            <p className={`text-sm leading-relaxed line-clamp-2 ${learnDone ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-700 dark:text-gray-300"}`}>
              {day.learnTask}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs mt-0.5 shrink-0">🛠️</span>
            <p className={`text-sm leading-relaxed line-clamp-2 ${buildDone ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-700 dark:text-gray-300"}`}>
              {day.buildTask}
            </p>
          </div>
          {/* Reflection preview */}
          {reflection && (
            <div className="flex items-start gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs mt-0.5 shrink-0">💡</span>
              <p className="text-xs italic text-gray-500 dark:text-gray-400 line-clamp-1">
                {reflection}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Day, TaskItem } from "@/lib/types";
import { useToast } from "@/lib/toast-context";
import { useProgress } from "@/lib/progress-context";
import DayChecklist from "@/components/DayChecklist";
import PomodoroTimer from "@/components/PomodoroTimer";
import DailyReflection from "@/components/DailyReflection";
import QuickAddResource from "@/components/QuickAddResource";

type DayTabId = "tasks" | "timer" | "notes";

interface DayData extends Omit<Day, 'week'> {
  skipped?: boolean;
  confidence?: number | null;
  reflection?: string | null;
  week?: { weekNumber: number; title: string; phase?: { name: string; badge: string } };
}

/**
 * Enhancement #3: Day Detail Page with tabs (Tasks | Timer | Notes).
 * Header (breadcrumb, day info, navigation) stays outside the tabs.
 */
export default function DayDetailPage() {
  const params = useParams();
  const weekNumber = Number(params.weekNumber);
  const daySort = Number(params.daySort);
  const { showToast } = useToast();
  const { markDayComplete, forceRefresh } = useProgress();

  const [day, setDay] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [learnDone, setLearnDone] = useState(false);
  const [buildDone, setBuildDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [savingConfidence, setSavingConfidence] = useState(false);
  const [activeTab, setActiveTab] = useState<DayTabId>("tasks");

  useEffect(() => {
    async function fetchDay() {
      try {
        setLoading(true);
        // Enhancement #7: Use the single full endpoint
        const res = await fetch(`/api/days/by-week/full?weekNumber=${weekNumber}&sortOrder=${daySort}`);
        if (res.ok) {
          const fullData = await res.json();
          setDay(fullData.day);
          setNote(fullData.day.note || "");
          setLearnDone(fullData.day.learnComplete);
          setBuildDone(fullData.day.buildComplete);
          setSkipped(fullData.day.skipped || false);
          setConfidence(fullData.day.confidence ?? null);
        } else {
          // Fallback to original endpoint
          const fallbackRes = await fetch(`/api/days/by-week?weekNumber=${weekNumber}&sortOrder=${daySort}`);
          if (!fallbackRes.ok) throw new Error("Day not found");
          const data: DayData = await fallbackRes.json();
          setDay(data);
          setNote(data.note || "");
          setLearnDone(data.learnComplete);
          setBuildDone(data.buildComplete);
          setSkipped(data.skipped || false);
          setConfidence(data.confidence ?? null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load day");
      } finally {
        setLoading(false);
      }
    }

    if (weekNumber >= 1 && weekNumber <= 52 && daySort >= 1 && daySort <= 7) {
      fetchDay();
    } else {
      setError("Invalid week or day number");
      setLoading(false);
    }
  }, [weekNumber, daySort]);

  async function handleTaskToggle(task: 'learn' | 'build', checked: boolean) {
    if (!day) return;
    const newLearn = task === 'learn' ? checked : learnDone;
    const newBuild = task === 'build' ? checked : buildDone;

    if (task === 'learn') setLearnDone(checked);
    if (task === 'build') setBuildDone(checked);

    setSaving(true);
    try {
      const res = await fetch(`/api/days/${day.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnComplete: newLearn, buildComplete: newBuild }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setDay((prev) => prev ? { ...prev, isComplete: updated.isComplete, learnComplete: updated.learnComplete, buildComplete: updated.buildComplete } : prev);

      if (updated.isComplete && !day.isComplete) {
        showToast("🎉 Day complete!", "success");
      }
      if (updated.weekIsComplete) {
        showToast("🏆 Week complete! Amazing!", "success");
      }
      markDayComplete(day.id, day.weekId, updated.isComplete, updated.weekIsComplete);
      forceRefresh();

      // Enhancement #12: Show achievement toast if unlocked
      if (updated.newAchievement) {
        showToast(`${updated.newAchievement.icon} Achievement unlocked: ${updated.newAchievement.title}!`, "success");
      }
    } catch {
      if (task === 'learn') setLearnDone(!checked);
      if (task === 'build') setBuildDone(!checked);
      showToast("Failed to update", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSkipDay() {
    if (!day) return;
    const newSkipped = !skipped;
    setSkipped(newSkipped);
    try {
      const res = await fetch(`/api/days/${day.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skipped: newSkipped }),
      });
      if (res.ok) {
        showToast(newSkipped ? "Day skipped" : "Day unskipped", "success");
        forceRefresh();
      } else {
        setSkipped(!newSkipped);
        showToast("Failed to update", "error");
      }
    } catch {
      setSkipped(!newSkipped);
      showToast("Failed to update", "error");
    }
  }

  async function handleConfidenceRate(rating: number) {
    if (!day) return;
    setSavingConfidence(true);
    setConfidence(rating);
    try {
      const res = await fetch(`/api/days/${day.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confidence: rating }),
      });
      if (res.ok) {
        showToast("Confidence saved", "success");
      } else {
        showToast("Failed to save", "error");
      }
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSavingConfidence(false);
    }
  }

  async function handleNoteSave() {
    if (!day) return;
    const currentNote = note.trim();
    const originalNote = (day.note || "").trim();
    if (currentNote === originalNote) return;

    setSavingNote(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayId: day.id, content: note }),
      });
      if (res.ok) showToast("Note saved", "success");
      else showToast("Failed to save note", "error");
    } catch {
      showToast("Failed to save note", "error");
    } finally {
      setSavingNote(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-6 w-48" />
        <div className="skeleton h-4 w-72" />
        <div className="skeleton h-40 w-full rounded-xl" />
        <div className="skeleton h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !day) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
        <p className="text-red-600 dark:text-red-400 font-medium">{error || "Day not found"}</p>
        <Link href={`/week/${weekNumber}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">← Back to Week {weekNumber}</Link>
      </div>
    );
  }

  const bothComplete = learnDone && buildDone;

  const tabs: { id: DayTabId; label: string }[] = [
    { id: "tasks", label: "Tasks" },
    { id: "timer", label: "Timer" },
    { id: "notes", label: "Notes" },
  ];

  return (
    <div className={`space-y-6 animate-fade-in ${skipped ? 'opacity-60' : ''}`}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <Link href="/progress" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Progress</Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <Link href={`/week/${weekNumber}`} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Week {weekNumber}</Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">{day.dayLabel}</span>
      </div>

      {/* Day Header */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className={`text-xl font-bold text-gray-900 dark:text-gray-100 ${skipped ? 'line-through' : ''}`}>{day.dayLabel}</h1>
            {skipped && <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 ring-1 ring-gray-300 dark:ring-gray-600">Skipped</span>}
            {!skipped && bothComplete && <span className="badge-green">✓ Complete</span>}
            {!skipped && (learnDone || buildDone) && !bothComplete && <span className="badge-blue">In Progress</span>}
          </div>
          <div className="flex items-center gap-2">
            {day.week?.phase && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {day.week.phase.badge} Week {weekNumber}
              </span>
            )}
            <button
              onClick={handleSkipDay}
              className={`min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                skipped
                  ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              title={skipped ? "Unskip this day" : "Skip this day"}
            >
              {skipped ? "Unskip" : "Skip Day"}
            </button>
          </div>
        </div>
        {day.week && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{day.week.title}</p>
        )}

        {/* Confidence rating display */}
        {confidence && (
          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Confidence:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={`text-sm ${star <= confidence ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}>★</span>
            ))}
          </div>
        )}

        {/* Day navigation */}
        <div className="flex justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          {daySort > 1 ? (
            <Link href={`/week/${weekNumber}/day/${daySort - 1}`} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
              ← Previous Day
            </Link>
          ) : weekNumber > 1 ? (
            <Link href={`/week/${weekNumber - 1}`} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
              ← Week {weekNumber - 1}
            </Link>
          ) : <span />}
          {daySort < 6 ? (
            <Link href={`/week/${weekNumber}/day/${daySort + 1}`} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
              Next Day →
            </Link>
          ) : weekNumber < 52 ? (
            <Link href={`/week/${weekNumber + 1}`} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
              Week {weekNumber + 1} →
            </Link>
          ) : <span />}
        </div>
      </div>

      {/* Enhancement #3: Tabs */}
      {!skipped && (
        <>
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px gap-1" aria-label="Day detail tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[44px] min-w-[44px] px-4 py-2.5 text-sm font-medium border-b-2 transition-all rounded-t-lg ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/50"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  aria-selected={activeTab === tab.id}
                  role="tab"
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div role="tabpanel" className="animate-fade-in">
            {activeTab === "tasks" && (
              <div className="space-y-6">
                {/* Learn Task Card */}
                <section className={`card overflow-hidden ${learnDone ? "border-purple-200 dark:border-purple-800" : ""}`}>
                  <div className={`px-5 py-3 flex items-center justify-between ${learnDone ? "bg-purple-50 dark:bg-purple-950" : "bg-gray-50 dark:bg-gray-800/50"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📖</span>
                      <h2 className="text-sm font-semibold text-purple-700 dark:text-purple-300">Learn</h2>
                    </div>
                    <label className="flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer">
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                        learnDone ? "bg-purple-500 border-purple-500 text-white" : "border-purple-300 dark:border-purple-600 hover:border-purple-400"
                      }`}>
                        {learnDone && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={learnDone}
                        onChange={(e) => handleTaskToggle('learn', e.target.checked)}
                        disabled={saving}
                        className="sr-only"
                        aria-label={`Mark learn task as ${learnDone ? 'incomplete' : 'complete'}`}
                      />
                    </label>
                  </div>
                  <div className="p-5">
                    <p className={`text-base leading-relaxed ${learnDone ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-800 dark:text-gray-200"}`}>
                      {day.learnTask}
                    </p>
                  </div>
                </section>

                {/* Build Task Card */}
                <section className={`card overflow-hidden ${buildDone ? "border-emerald-200 dark:border-emerald-800" : ""}`}>
                  <div className={`px-5 py-3 flex items-center justify-between ${buildDone ? "bg-emerald-50 dark:bg-emerald-950" : "bg-gray-50 dark:bg-gray-800/50"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🛠️</span>
                      <h2 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Build</h2>
                    </div>
                    <label className="flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer">
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                        buildDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-emerald-300 dark:border-emerald-600 hover:border-emerald-400"
                      }`}>
                        {buildDone && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={buildDone}
                        onChange={(e) => handleTaskToggle('build', e.target.checked)}
                        disabled={saving}
                        className="sr-only"
                        aria-label={`Mark build task as ${buildDone ? 'incomplete' : 'complete'}`}
                      />
                    </label>
                  </div>
                  <div className="p-5">
                    <p className={`text-base leading-relaxed ${buildDone ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-800 dark:text-gray-200"}`}>
                      {day.buildTask}
                    </p>
                  </div>
                </section>

                {/* Confidence Rating */}
                {bothComplete && (
                  <section className="card p-5">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">How confident do you feel?</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Rate your understanding of today&apos;s material</p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleConfidenceRate(star)}
                          disabled={savingConfidence}
                          className={`min-h-[44px] min-w-[44px] text-2xl transition-all duration-200 rounded-lg hover:scale-110 ${
                            confidence && star <= confidence
                              ? 'text-yellow-500'
                              : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                          }`}
                          aria-label={`Rate confidence ${star} out of 5`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Sub-tasks Checklist */}
                <section className="card p-5">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">Sub-tasks</h2>
                  <DayChecklist
                    dayId={day.id}
                    onCompletionChange={(learnComplete, buildComplete) => {
                      setLearnDone(learnComplete);
                      setBuildDone(buildComplete);
                      const isComplete = learnComplete && buildComplete;
                      setDay((prev) => prev ? { ...prev, isComplete, learnComplete, buildComplete } : prev);
                      if (isComplete && !day.isComplete) {
                        showToast("🎉 Day complete!", "success");
                      }
                    }}
                  />
                </section>
              </div>
            )}

            {activeTab === "timer" && (
              <div className="space-y-6">
                <PomodoroTimer />
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-6">
                {/* Daily Reflection */}
                {bothComplete && (
                  <DailyReflection dayId={day.id} initialReflection={day.reflection ?? null} />
                )}

                {/* Notes */}
                <section className="card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Notes</h2>
                    <span className="text-xs text-gray-400 dark:text-gray-500">Auto-saves on blur</span>
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onBlur={handleNoteSave}
                    rows={6}
                    placeholder="Write notes about what you learned, questions, insights..."
                    className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm resize-y bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-200 dark:placeholder:text-gray-500 transition-colors"
                  />
                  {savingNote && <span className="text-xs text-blue-500">Saving...</span>}
                </section>

                {/* Quick Add Resource */}
                {day && (
                  <section className="card p-5">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Resources</h2>
                    <QuickAddResource dayId={day.id} weekId={day.weekId} />
                  </section>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

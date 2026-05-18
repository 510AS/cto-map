"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Day, ReviewResponse, BuildLogEntry, TaskItem } from "@/lib/types";
import DayRow from "@/components/DayRow";
import CompletionCelebration from "@/components/CompletionCelebration";
import { useProgress } from "@/lib/progress-context";
import { useToast } from "@/lib/toast-context";

type TabId = "days" | "notes" | "review" | "build-log";

/** Day with optional task items included from the API. */
interface DayWithTaskItems extends Day {
  taskItems?: TaskItem[];
}

interface WeekData {
  id: number;
  weekNumber: number;
  title: string;
  goal: string;
  saasEvolution: string;
  isComplete: boolean;
  hoursLogged: number | null;
  note: string | null;
  phaseId: number;
  days: DayWithTaskItems[];
  reviewResponses: ReviewResponse[];
  buildLogEntry: BuildLogEntry | null;
  phase?: { id: number; name: string; badge: string; sortOrder: number };
}

export default function WeekDetailPage() {
  const params = useParams();
  const weekNumber = Number(params.weekNumber);
  const { markDayComplete } = useProgress();
  const { showToast } = useToast();

  const [week, setWeek] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("days");
  const [showCelebration, setShowCelebration] = useState(false);
  const [hoursInput, setHoursInput] = useState("");
  const [savingHours, setSavingHours] = useState(false);

  useEffect(() => {
    async function fetchWeekData() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/weeks/${weekNumber}?include=full`);
        if (!res.ok) throw new Error("Failed to fetch week data");
        const data = await res.json();
        setWeek(data);
        setHoursInput(data.hoursLogged != null ? String(data.hoursLogged) : "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load week data");
      } finally {
        setLoading(false);
      }
    }

    if (weekNumber >= 1 && weekNumber <= 52) {
      fetchWeekData();
    } else {
      setError("Week number must be between 1 and 52");
      setLoading(false);
    }
  }, [weekNumber]);

  async function handleHoursSave() {
    if (!week) return;
    const hours = parseFloat(hoursInput);
    if (isNaN(hours) || hours < 0) return;

    setSavingHours(true);
    try {
      const res = await fetch(`/api/weeks/${week.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoursLogged: hours }),
      });
      if (res.ok) {
        setWeek((prev) => prev ? { ...prev, hoursLogged: hours } : prev);
        showToast("Hours saved", "success");
      } else {
        showToast("Failed to save hours", "error");
      }
    } catch {
      showToast("Failed to save hours", "error");
    } finally {
      setSavingHours(false);
    }
  }

  async function handleDayToggle(dayId: number, isComplete: boolean) {
    if (!week) return;

    const previousDay = week.days.find((d) => d.id === dayId);
    const wasComplete = previousDay?.isComplete ?? false;

    setWeek((prev) => {
      if (!prev) return prev;
      const updatedDays = prev.days.map((d) => d.id === dayId ? { ...d, isComplete } : d);
      const allComplete = updatedDays.every((d) => d.isComplete);
      return { ...prev, days: updatedDays, isComplete: allComplete };
    });
    const updatedDays = week.days.map((d) => d.id === dayId ? { ...d, isComplete } : d);
    const allComplete = updatedDays.every((d) => d.isComplete);
    markDayComplete(dayId, week.id, isComplete, allComplete);

    if (isComplete && !wasComplete) {
      setShowCelebration(true);
    }
  }

  const handleDismissCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  async function handleNoteSave(content: string) {
    if (!week) return;
    try {
      const res = await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weekId: week.id, content }) });
      if (res.ok) { setWeek((prev) => (prev ? { ...prev, note: content } : prev)); showToast("Note saved", "success"); }
      else { showToast("Failed to save note", "error"); }
    } catch { showToast("Failed to save note", "error"); }
  }

  async function handleReviewSave(prompt: string, response: string) {
    if (!week) return;
    try {
      const res = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weekId: week.id, prompt, response }) });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setWeek((prev) => {
        if (!prev) return prev;
        const existing = prev.reviewResponses || [];
        const idx = existing.findIndex((r) => r.prompt === prompt);
        const updated = idx >= 0 ? existing.map((r, i) => (i === idx ? saved : r)) : [...existing, saved];
        return { ...prev, reviewResponses: updated };
      });
      showToast("Review saved", "success");
    } catch { showToast("Failed to save review", "error"); }
  }

  async function handleBuildLogSave(content: string) {
    if (!week) return;
    try {
      const res = await fetch("/api/build-log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weekId: week.id, content }) });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setWeek((prev) => (prev ? { ...prev, buildLogEntry: saved } : prev));
      showToast("Build log saved", "success");
    } catch { showToast("Failed to save build log", "error"); }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-72" />
        <div className="skeleton h-32 w-full rounded-xl" />
        <div className="skeleton h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        <Link href="/progress" className="min-h-[44px] min-w-[44px] inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline">← Back to Progress</Link>
      </div>
    );
  }

  if (!week) return <div className="flex items-center justify-center min-h-[200px]"><p className="text-gray-500 dark:text-gray-400">Week not found.</p></div>;

  const nonSkippedDays = week.days.filter((d) => !(d as any).skipped);
  const completedDays = nonSkippedDays.filter((d) => d.isComplete).length;
  const totalDays = nonSkippedDays.length;
  const completionPct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "days", label: "Days", count: completedDays },
    { id: "notes", label: "Notes" },
    { id: "review", label: "Review", count: (week.reviewResponses || []).length },
    { id: "build-log", label: "Build Log" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/progress" className="min-h-[44px] min-w-[44px] inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Progress</Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">Week {week.weekNumber}</span>
      </div>

      {/* Week Header */}
      <div className="card p-5">
        <div className="flex items-center gap-2 text-sm mb-2">
          {week.phase && <span className="badge-blue">{week.phase.badge} {week.phase.name}</span>}
          {week.isComplete && <span className="badge-green">✓ Complete</span>}
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Week {week.weekNumber}: {week.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{week.goal}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/print/week/${weekNumber}`}
              className="min-h-[44px] min-w-[44px] inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Print-friendly view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </Link>
            <Link
              href={`/week/${weekNumber}/plan`}
              className="min-h-[44px] min-w-[44px] shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Plan
            </Link>
          </div>
        </div>

        {/* Hours Logging */}
        <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <label htmlFor="hours-input" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Hours:
          </label>
          <input
            id="hours-input"
            type="number"
            min="0"
            step="0.5"
            value={hoursInput}
            onChange={(e) => setHoursInput(e.target.value)}
            onBlur={handleHoursSave}
            onKeyDown={(e) => { if (e.key === 'Enter') handleHoursSave(); }}
            placeholder="0"
            className="min-h-[44px] w-24 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          {savingHours && <span className="text-xs text-blue-500">Saving...</span>}
          {week.hoursLogged != null && !savingHours && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{week.hoursLogged}h logged</span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>{completedDays}/{totalDays} days completed</span>
            <span className="font-semibold">{completionPct}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${completionPct === 100 ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"}`}
              style={{ width: `${completionPct}%` }}
              role="progressbar"
              aria-valuenow={completionPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Week navigation */}
        <div className="flex justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          {weekNumber > 1 ? (
            <Link href={`/week/${weekNumber - 1}`} className="min-h-[44px] min-w-[44px] inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">← Week {weekNumber - 1}</Link>
          ) : <span />}
          {weekNumber < 52 && (
            <Link href={`/week/${weekNumber + 1}`} className="min-h-[44px] min-w-[44px] inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">Week {weekNumber + 1} →</Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px gap-1" aria-label="Week detail tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] px-4 py-2.5 text-sm font-medium border-b-2 transition-all rounded-t-lg ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/50"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div role="tabpanel" className="animate-fade-in">
        {activeTab === "days" && <DaysTab days={week.days} weekNumber={week.weekNumber} onToggle={handleDayToggle} />}
        {activeTab === "notes" && <NotesTab note={week.note || ""} onSave={handleNoteSave} />}
        {activeTab === "review" && <ReviewTab responses={week.reviewResponses || []} onSave={handleReviewSave} />}
        {activeTab === "build-log" && <BuildLogTab entry={week.buildLogEntry} onSave={handleBuildLogSave} />}
      </div>

      {/* Completion Celebration */}
      <CompletionCelebration show={showCelebration} onDismiss={handleDismissCelebration} />
    </div>
  );
}

function DaysTab({ days, weekNumber, onToggle }: { days: DayWithTaskItems[]; weekNumber: number; onToggle: (dayId: number, isComplete: boolean) => void }) {
  const sortedDays = [...days].sort((a, b) => a.sortOrder - b.sortOrder);
  const daysWithWeek = sortedDays.map((d) => ({ ...d, week: { weekNumber } }));
  const { showToast } = useToast();

  async function handleSwap(dayId1: number, dayId2: number) {
    try {
      const res = await fetch('/api/days/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId1, dayId2 }),
      });
      if (res.ok) {
        showToast('Days swapped', 'success');
        window.location.reload();
      } else {
        showToast('Failed to swap days', 'error');
      }
    } catch {
      showToast('Failed to swap days', 'error');
    }
  }

  return (
    <div className="space-y-3">
      {daysWithWeek.map((day, index) => (
        <div key={day.id} className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5 shrink-0">
            <button
              onClick={() => index > 0 && handleSwap(day.id, sortedDays[index - 1].id)}
              disabled={index === 0}
              className="min-h-[22px] min-w-[22px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move up"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => index < sortedDays.length - 1 && handleSwap(day.id, sortedDays[index + 1].id)}
              disabled={index === sortedDays.length - 1}
              className="min-h-[22px] min-w-[22px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move down"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div className="flex-1">
            <DayRow day={day as any} onToggleComplete={onToggle} />
          </div>
        </div>
      ))}
      {sortedDays.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">No days found for this week.</p>}
    </div>
  );
}

function NotesTab({ note, onSave }: { note: string; onSave: (content: string) => void }) {
  const [content, setContent] = useState(note);
  useEffect(() => { setContent(note); }, [note]);
  function handleBlur() { if (content !== note) onSave(content); }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="week-note" className="text-sm font-medium text-gray-700 dark:text-gray-300">Week Notes</label>
        <span className="text-xs text-gray-400 dark:text-gray-500">Auto-saves on blur</span>
      </div>
      <textarea
        id="week-note"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleBlur}
        rows={10}
        className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-y bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500 transition-colors"
        placeholder="Capture insights, questions, and reflections..."
      />
    </div>
  );
}

const REVIEW_PROMPTS = [
  { key: "learned", label: "What did I learn?", icon: "📖" },
  { key: "built", label: "What did I build?", icon: "🛠️" },
  { key: "difficult", label: "What was difficult?", icon: "🤔" },
  { key: "differently", label: "What will I do differently?", icon: "🔄" },
] as const;

function ReviewTab({ responses, onSave }: { responses: ReviewResponse[]; onSave: (prompt: string, response: string) => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => { const initial: Record<string, string> = {}; for (const r of responses) initial[r.prompt] = r.response; setValues(initial); }, [responses]);
  function handleBlur(promptKey: string) { const v = values[promptKey] || ""; const e = responses.find((r) => r.prompt === promptKey); if (v !== (e?.response || "")) onSave(promptKey, v); }

  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-400 dark:text-gray-500">Auto-saves when you click away from each field</p>
      {REVIEW_PROMPTS.map((prompt) => (
        <div key={prompt.key} className="space-y-2">
          <label htmlFor={`review-${prompt.key}`} className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <span>{prompt.icon}</span>{prompt.label}
          </label>
          <textarea
            id={`review-${prompt.key}`}
            value={values[prompt.key] || ""}
            onChange={(e) => setValues((prev) => ({ ...prev, [prompt.key]: e.target.value }))}
            onBlur={() => handleBlur(prompt.key)}
            rows={3}
            className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-y bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500 transition-colors"
            placeholder="Write your response..."
          />
        </div>
      ))}
    </div>
  );
}

function BuildLogTab({ entry, onSave }: { entry: BuildLogEntry | null; onSave: (content: string) => void }) {
  const [content, setContent] = useState(entry?.content || "");
  useEffect(() => { setContent(entry?.content || ""); }, [entry]);
  function handleBlur() { if (content !== (entry?.content || "")) onSave(content); }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="build-log" className="text-sm font-medium text-gray-700 dark:text-gray-300">Build Log</label>
        <span className="text-xs text-gray-400 dark:text-gray-500">Auto-saves on blur</span>
      </div>
      <textarea
        id="build-log"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleBlur}
        rows={10}
        className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-y bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500 transition-colors"
        placeholder="Describe what you built and shipped..."
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/toast-context";
import { useTheme } from "@/lib/theme-context";

export default function SettingsPage() {
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [syncExporting, setSyncExporting] = useState(false);
  const [syncImporting, setSyncImporting] = useState(false);
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        if (data.startDate) {
          setStartDate(data.startDate.split("T")[0]);
        }
      } catch {
        showToast("Failed to load settings", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [showToast]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate) return;

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: new Date(startDate).toISOString() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      showToast("Start date saved!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cto-learning-portfolio.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Portfolio exported!", "success");
    } catch {
      showToast("Export failed", "error");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-48 w-full max-w-md rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

      {/* Start Date */}
      <form onSubmit={handleSave} className="card p-6 max-w-md space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Curriculum</h2>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Date
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            The date you started (or plan to start) Week 1. Used to calculate your current position.
          </p>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="block w-full min-h-[44px] px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 dark:text-gray-200 transition-colors"
            required
          />
        </div>

        <button
          type="submit"
          disabled={saving || !startDate}
          className="min-h-[44px] w-full px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {saving ? "Saving..." : "Save Start Date"}
        </button>
      </form>

      {/* Theme */}
      <div className="card p-6 max-w-md space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Appearance</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Choose your preferred color theme.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
              theme === 'light'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
              theme === 'dark'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Dark</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
              theme === 'system'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">System</span>
          </button>
        </div>
      </div>

      {/* Export */}
      <div className="card p-6 max-w-md space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Data</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Export your learning journey as a markdown portfolio file.
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="min-h-[44px] w-full px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {exporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export Portfolio (.md)</span>
            </>
          )}
        </button>
      </div>

      {/* Multi-Device Sync */}
      <div className="card p-6 max-w-md space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Multi-Device Sync</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Export all data as JSON for backup or import on another device.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={async () => {
              setSyncExporting(true);
              try {
                const res = await fetch('/api/sync/export');
                if (!res.ok) throw new Error();
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cto-sync-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast('Data exported!', 'success');
              } catch {
                showToast('Export failed', 'error');
              } finally {
                setSyncExporting(false);
              }
            }}
            disabled={syncExporting}
            className="min-h-[44px] flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            {syncExporting ? 'Exporting...' : '⬇️ Export JSON'}
          </button>
          <label className="min-h-[44px] flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm cursor-pointer flex items-center justify-center">
            {syncImporting ? 'Importing...' : '⬆️ Import JSON'}
            <input
              type="file"
              accept=".json"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setSyncImporting(true);
                try {
                  const text = await file.text();
                  const data = JSON.parse(text);
                  const res = await fetch('/api/sync/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  });
                  if (!res.ok) throw new Error();
                  const result = await res.json();
                  showToast(`Imported! ${result.imported.weeks} weeks, ${result.imported.days} days`, 'success');
                } catch {
                  showToast('Import failed — check file format', 'error');
                } finally {
                  setSyncImporting(false);
                  e.target.value = '';
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Achievements Link */}
      <div className="card p-6 max-w-md space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Achievements</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          View your earned badges and track progress toward new ones.
        </p>
        <a
          href="/achievements"
          className="min-h-[44px] w-full px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-medium rounded-lg hover:from-yellow-600 hover:to-amber-600 transition-all shadow-sm flex items-center justify-center gap-2"
        >
          🏆 View Achievements
        </a>
      </div>
    </div>
  );
}

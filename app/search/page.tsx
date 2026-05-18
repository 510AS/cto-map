"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

interface SearchResult {
  id: number;
  label: string;
  snippet: string;
  link: string;
}

interface SearchResults {
  days: SearchResult[];
  weeks: SearchResult[];
  buildLogs: SearchResult[];
  reviews: SearchResult[];
  bookmarks: SearchResult[];
  taskItems: SearchResult[];
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data);
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    // Debounce search
    const timeout = setTimeout(() => handleSearch(value), 300);
    return () => clearTimeout(timeout);
  }

  const totalResults = results
    ? results.days.length + results.weeks.length + results.buildLogs.length +
      results.reviews.length + results.bookmarks.length + results.taskItems.length
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Search</h1>

      {/* Search Input */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search notes, tasks, bookmarks..."
          autoFocus
          className="w-full min-h-[44px] pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-base bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-200 dark:placeholder:text-gray-500 transition-colors"
          aria-label="Search"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Keyboard shortcut hint */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Tip: Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-[10px] font-mono">⌘K</kbd> from anywhere to open search
      </p>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Results */}
      {results && totalResults === 0 && query.length >= 2 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No results found for &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {results && totalResults > 0 && (
        <div className="space-y-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">{totalResults} result{totalResults !== 1 ? 's' : ''} found</p>

          <ResultSection title="📖 Day Notes" results={results.days} />
          <ResultSection title="📅 Weeks" results={results.weeks} />
          <ResultSection title="🛠️ Build Logs" results={results.buildLogs} />
          <ResultSection title="🔄 Reviews" results={results.reviews} />
          <ResultSection title="🔖 Bookmarks" results={results.bookmarks} />
          <ResultSection title="✅ Tasks" results={results.taskItems} />
        </div>
      )}
    </div>
  );
}

function ResultSection({ title, results }: { title: string; results: SearchResult[] }) {
  if (results.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">{title}</h2>
      <div className="space-y-2">
        {results.map((r) => (
          <Link
            key={`${title}-${r.id}`}
            href={r.link}
            className="block card px-4 py-3 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          >
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.label}</p>
            {r.snippet && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{r.snippet}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface WeekNode {
  weekNumber: number;
  title: string;
  status: 'complete' | 'in-progress' | 'not-started';
}

interface TagGroup {
  id: number;
  name: string;
  weeks: WeekNode[];
}

/**
 * Enhancement #16: Simple adjacency map of related tags.
 * Below each tag card, shows "Related: ..." as clickable links that scroll to that tag section.
 */
const TAG_CONNECTIONS: Record<string, string[]> = {
  php: ['laravel', 'testing'],
  laravel: ['php', 'db', 'api'],
  devops: ['infra', 'networking'],
  infra: ['devops', 'networking'],
  db: ['laravel', 'perf'],
  security: ['networking', 'api'],
  ai: ['api', 'system'],
  networking: ['devops', 'infra', 'security'],
  api: ['laravel', 'security', 'ai'],
  testing: ['php', 'laravel'],
  perf: ['db', 'infra'],
  system: ['ai', 'devops'],
};

export default function KnowledgePage() {
  const [tags, setTags] = useState<TagGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const tagRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    async function fetchKnowledge() {
      try {
        const res = await fetch("/api/knowledge");
        if (res.ok) setTags(await res.json());
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    fetchKnowledge();
  }, []);

  function scrollToTag(tagName: string) {
    const el = tagRefs.current[tagName.toLowerCase()];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Brief highlight
      el.classList.add('ring-2', 'ring-blue-500');
      setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500'), 1500);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const statusColors = {
    complete: 'bg-green-500 dark:bg-green-400',
    'in-progress': 'bg-blue-500 dark:bg-blue-400',
    'not-started': 'bg-gray-300 dark:bg-gray-600',
  };

  const statusBorder = {
    complete: 'border-green-200 dark:border-green-800',
    'in-progress': 'border-blue-200 dark:border-blue-800',
    'not-started': 'border-gray-200 dark:border-gray-700',
  };

  // Build a set of existing tag names for filtering connections
  const existingTagNames = new Set(tags.map((t) => t.name.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Knowledge Graph</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Topics grouped by tag. Each node represents a week in the curriculum.
      </p>

      {tags.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-12">No tags found. Seed your curriculum data first.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => {
            const completedCount = tag.weeks.filter((w) => w.status === 'complete').length;
            const totalCount = tag.weeks.length;
            const tagNameLower = tag.name.toLowerCase();
            // Enhancement #16: Get related tags that actually exist in the data
            const relatedTags = (TAG_CONNECTIONS[tagNameLower] || []).filter(
              (rt) => existingTagNames.has(rt)
            );

            return (
              <div
                key={tag.id}
                ref={(el) => { tagRefs.current[tagNameLower] = el; }}
                className="card p-4 space-y-3 transition-all duration-300"
                id={`tag-${tagNameLower}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
                    {tag.name}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {completedCount}/{totalCount}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tag.weeks.map((w) => (
                    <Link
                      key={w.weekNumber}
                      href={`/week/${w.weekNumber}`}
                      className={`min-h-[28px] min-w-[28px] flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium rounded border transition-all hover:scale-110 ${statusBorder[w.status]}`}
                      title={`Week ${w.weekNumber}: ${w.title} (${w.status})`}
                    >
                      <div className={`w-2 h-2 rounded-full mr-1 ${statusColors[w.status]}`} />
                      <span className="text-gray-700 dark:text-gray-300">{w.weekNumber}</span>
                    </Link>
                  ))}
                </div>
                {/* Enhancement #16: Related tags */}
                {relatedTags.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">Related:</span>
                    {relatedTags.map((rt) => (
                      <button
                        key={rt}
                        onClick={() => scrollToTag(rt)}
                        className="min-h-[28px] px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors capitalize"
                      >
                        {rt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500 dark:bg-green-400" />
          <span>Complete</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
          <span>Not Started</span>
        </div>
      </div>
    </div>
  );
}

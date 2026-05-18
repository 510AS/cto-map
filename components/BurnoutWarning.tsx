'use client';

import { useEffect, useState } from 'react';

interface BurnoutData {
  risk: 'low' | 'medium' | 'high';
  score: number;
  suggestions: string[];
  factors: string[];
}

export default function BurnoutWarning() {
  const [data, setData] = useState<BurnoutData | null>(null);

  useEffect(() => {
    async function fetchBurnout() {
      try {
        const res = await fetch('/api/burnout-check');
        if (res.ok) {
          const result = await res.json();
          if (result.risk === 'medium' || result.risk === 'high') {
            setData(result);
          }
        }
      } catch { /* ignore */ }
    }
    fetchBurnout();
  }, []);

  if (!data) return null;

  const isHigh = data.risk === 'high';

  return (
    <section className={`card p-5 space-y-3 ${
      isHigh
        ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30'
        : 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{isHigh ? '🚨' : '⚠️'}</span>
        <h3 className={`text-sm font-semibold ${
          isHigh ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'
        }`}>
          {isHigh ? 'Burnout Risk Detected' : 'Take It Easy'}
        </h3>
      </div>

      {data.factors.length > 0 && (
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          {data.factors.map((f, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="shrink-0 mt-0.5">•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}

      {data.suggestions.length > 0 && (
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Suggestions:</p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {data.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="shrink-0 mt-0.5">💡</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

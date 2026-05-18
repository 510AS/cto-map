'use client';

import { useEffect, useState } from 'react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
}

export default function WeeklyChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChallenges() {
      try {
        const res = await fetch('/api/challenges');
        if (res.ok) {
          const data = await res.json();
          setChallenges(data.challenges || []);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    fetchChallenges();
  }, []);

  if (loading || challenges.length === 0) return null;

  return (
    <section className="card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        Weekly Challenges
      </h3>
      <div className="space-y-3">
        {challenges.map((c) => {
          const pct = c.target > 0 ? Math.min(100, Math.round((c.current / c.target) * 100)) : 0;
          const isComplete = c.current >= c.target;
          return (
            <div key={c.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isComplete && <span className="text-green-500 text-xs">✓</span>}
                  <span className={`text-sm font-medium ${isComplete ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {c.title}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {c.current}/{c.target}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{c.description}</p>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    isComplete ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

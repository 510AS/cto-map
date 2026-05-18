'use client';

import { useEffect, useState } from 'react';

interface XPData {
  xp: number;
  level: number;
  currentInLevel: number;
  neededForNext: number;
  progress: number;
}

export default function XPBar() {
  const [data, setData] = useState<XPData | null>(null);

  useEffect(() => {
    async function fetchXP() {
      try {
        const res = await fetch('/api/xp');
        if (res.ok) setData(await res.json());
      } catch { /* ignore */ }
    }
    fetchXP();
  }, []);

  if (!data) return null;

  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
          Lvl {data.level}
        </span>
        <span className="text-[10px] text-gray-500 dark:text-gray-400">
          {data.xp} XP
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${data.progress}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
        {data.currentInLevel}/{data.neededForNext} to next level
      </p>
    </div>
  );
}

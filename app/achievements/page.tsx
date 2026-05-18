"use client";

import { useEffect, useState } from "react";
import { ACHIEVEMENTS, AchievementDef } from "@/lib/achievements";

interface EarnedAchievement {
  id: number;
  key: string;
  name: string;
  icon: string;
  earnedAt: string;
}

export default function AchievementsPage() {
  const [earned, setEarned] = useState<EarnedAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAchievements() {
      try {
        // Check for new achievements
        await fetch("/api/achievements", { method: "POST" });
        // Fetch all earned
        const res = await fetch("/api/achievements");
        if (res.ok) setEarned(await res.json());
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    fetchAchievements();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const earnedKeys = new Set(earned.map((a) => a.key));

  // Deduplicate achievements by key for display
  const uniqueAchievements: AchievementDef[] = [];
  const seenKeys = new Set<string>();
  for (const a of ACHIEVEMENTS) {
    if (!seenKeys.has(a.key)) {
      seenKeys.add(a.key);
      uniqueAchievements.push(a);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Achievements</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {earned.length}/{uniqueAchievements.length} unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {uniqueAchievements.map((achievement) => {
          const isEarned = earnedKeys.has(achievement.key);
          const earnedData = earned.find((e) => e.key === achievement.key);
          return (
            <div
              key={achievement.key}
              className={`card p-4 text-center space-y-2 transition-all ${
                isEarned
                  ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/30'
                  : 'opacity-50 grayscale'
              }`}
            >
              <div className="text-3xl">{achievement.icon}</div>
              <h3 className={`text-sm font-semibold ${
                isEarned ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {achievement.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {achievement.description}
              </p>
              {isEarned && earnedData && (
                <p className="text-[10px] text-yellow-600 dark:text-yellow-400">
                  Earned {new Date(earnedData.earnedAt).toLocaleDateString()}
                </p>
              )}
              {!isEarned && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500">🔒 Locked</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

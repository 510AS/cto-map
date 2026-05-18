/**
 * XP system: defines XP values and level thresholds.
 */

export const XP_VALUES = {
  SUB_TASK_COMPLETE: 5,
  DAY_COMPLETE: 50,
  WEEK_COMPLETE: 200,
  REVIEW_WRITTEN: 30,
  STREAK_DAY: 1, // multiplied by streak length
} as const;

/** Level thresholds: level N requires LEVEL_THRESHOLDS[N-1] total XP */
export const LEVEL_THRESHOLDS = [
  0,      // Level 1: 0 XP
  100,    // Level 2: 100 XP
  300,    // Level 3: 300 XP
  600,    // Level 4: 600 XP
  1000,   // Level 5: 1000 XP
  1500,   // Level 6: 1500 XP
  2200,   // Level 7: 2200 XP
  3000,   // Level 8: 3000 XP
  4000,   // Level 9: 4000 XP
  5200,   // Level 10: 5200 XP
  6600,   // Level 11: 6600 XP
  8200,   // Level 12: 8200 XP
  10000,  // Level 13: 10000 XP
  12000,  // Level 14: 12000 XP
  14500,  // Level 15: 14500 XP
];

export function getLevel(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

export function getXpForNextLevel(xp: number): { current: number; needed: number; progress: number } {
  const level = getLevel(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 2000;
  const xpInLevel = xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  return {
    current: xpInLevel,
    needed: xpNeeded,
    progress: xpNeeded > 0 ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100,
  };
}

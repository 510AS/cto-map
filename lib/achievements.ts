/**
 * Achievement definitions and condition checkers for the badge system.
 */

export interface AchievementDef {
  key: string;
  name: string;
  icon: string;
  description: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: 'first_day', name: 'First Step', icon: '🏅', description: 'Complete your first day' },
  { key: 'week_warrior', name: 'Week Warrior', icon: '🔥', description: 'Complete all 6 days in a week' },
  { key: 'speed_run', name: 'Speed Run', icon: '⚡', description: 'Finish a day in under 2 hours' },
  { key: 'scholar', name: 'Scholar', icon: '📚', description: 'Write reviews for 4 consecutive weeks' },
  { key: 'builder', name: 'Builder', icon: '🏗️', description: 'Fill build log for 10 weeks' },
  { key: 'precision', name: 'Precision', icon: '🎯', description: 'Estimate within 10% of actual time 5 times' },
  { key: 'phase_master', name: 'Phase Master', icon: '🌟', description: 'Complete an entire phase' },
  { key: 'technical_cto', name: 'Technical CTO', icon: '👑', description: 'Complete all 52 weeks' },
  { key: 'streak_7', name: 'On Fire', icon: '🔥', description: '7-day streak' },
  { key: 'streak_30', name: 'Unstoppable', icon: '🏆', description: '30-day streak' },
  // Legacy keys for backward compat
  { key: 'phase_1', name: 'Phase 1 Graduate', icon: '🎓', description: 'Complete Phase 1' },
  { key: 'reviewer', name: 'Reflective Mind', icon: '📝', description: 'Write 4 reviews in a week' },
  { key: 'builder_10', name: 'Master Builder', icon: '🏗️', description: 'Fill build log for 10 weeks' },
  { key: 'cto_graduate', name: 'CTO Graduate', icon: '🏆', description: 'Complete all 52 weeks' },
];

export function getAchievementDef(key: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.key === key);
}

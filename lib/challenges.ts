/**
 * Weekly challenges system.
 * Generates 3 challenges per week based on patterns.
 */

export interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
}

const CHALLENGE_TEMPLATES = [
  { id: 'days_before_wed', title: 'Early Bird', description: 'Complete 3 days before Wednesday', target: 3 },
  { id: 'log_hours', title: 'Time Tracker', description: 'Log at least 8 hours this week', target: 8 },
  { id: 'write_reviews', title: 'Reflector', description: 'Write all 4 review prompts', target: 4 },
  { id: 'add_resources', title: 'Resourceful', description: 'Add resource links to 5 tasks', target: 5 },
  { id: 'maintain_streak', title: 'Streak Keeper', description: 'Maintain your streak for 7 days', target: 7 },
];

/**
 * Generates 3 challenges for a given week number.
 * Uses the week number as a seed to deterministically pick challenges.
 */
export function generateChallenges(weekNumber: number): Omit<Challenge, 'current'>[] {
  const shuffled = [...CHALLENGE_TEMPLATES];
  // Simple deterministic shuffle based on week number
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (weekNumber * 7 + i * 3) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 3).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    target: c.target,
  }));
}

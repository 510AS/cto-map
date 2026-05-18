/**
 * Burnout detection: analyzes patterns to determine burnout risk.
 */

export type BurnoutRisk = 'low' | 'medium' | 'high';

export interface BurnoutResult {
  risk: BurnoutRisk;
  score: number; // 0-100
  suggestions: string[];
  factors: string[];
}

interface WeekStats {
  weekNumber: number;
  completedDays: number;
  totalDays: number;
  skippedDays: number;
  confidence: number | null;
}

/**
 * Analyzes recent week stats to determine burnout risk.
 * Looks at the last 4 weeks of data.
 */
export function detectBurnout(recentWeeks: WeekStats[]): BurnoutResult {
  if (recentWeeks.length < 2) {
    return { risk: 'low', score: 0, suggestions: [], factors: [] };
  }

  let score = 0;
  const factors: string[] = [];

  // Check declining completion rate
  const rates = recentWeeks.map((w) => w.totalDays > 0 ? w.completedDays / w.totalDays : 0);
  if (rates.length >= 2) {
    const recent = rates.slice(-2);
    const earlier = rates.slice(0, -2);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.length > 0 ? earlier.reduce((a, b) => a + b, 0) / earlier.length : 1;
    if (recentAvg < earlierAvg * 0.6) {
      score += 35;
      factors.push('Completion rate declining significantly');
    } else if (recentAvg < earlierAvg * 0.8) {
      score += 20;
      factors.push('Completion rate declining');
    }
  }

  // Check increasing skipped days
  const totalSkipped = recentWeeks.reduce((sum, w) => sum + w.skippedDays, 0);
  if (totalSkipped >= 4) {
    score += 30;
    factors.push('Multiple days skipped recently');
  } else if (totalSkipped >= 2) {
    score += 15;
    factors.push('Some days skipped');
  }

  // Check dropping confidence
  const confidences = recentWeeks
    .map((w) => w.confidence)
    .filter((c): c is number => c !== null);
  if (confidences.length >= 2) {
    const recentConf = confidences[confidences.length - 1];
    const avgConf = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    if (recentConf < avgConf - 1) {
      score += 25;
      factors.push('Confidence ratings dropping');
    }
  }

  // Check very low recent completion
  const lastWeek = recentWeeks[recentWeeks.length - 1];
  if (lastWeek && lastWeek.totalDays > 0 && lastWeek.completedDays === 0) {
    score += 20;
    factors.push('No days completed last week');
  }

  // Determine risk level
  let risk: BurnoutRisk = 'low';
  if (score >= 50) risk = 'high';
  else if (score >= 25) risk = 'medium';

  // Generate suggestions
  const suggestions: string[] = [];
  if (risk === 'high') {
    suggestions.push('Consider taking a lighter week — focus on just 2-3 days');
    suggestions.push('Try shorter study sessions (15-20 min) to rebuild momentum');
    suggestions.push('Review your goals — are they still aligned with your motivation?');
  } else if (risk === 'medium') {
    suggestions.push('Mix in some easier topics to maintain momentum');
    suggestions.push('Consider adjusting your daily time commitment');
  }

  return { risk, score: Math.min(100, score), suggestions, factors };
}

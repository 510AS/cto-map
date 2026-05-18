import { prisma } from '@/lib/prisma';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { calculateStreak } from '@/lib/calculations';

export interface NewAchievement {
  key: string;
  title: string;
  icon: string;
}

/**
 * Enhancement #12: Check and award achievements after a day is completed.
 * Returns newly unlocked achievement if any.
 */
export async function checkAchievementsAfterDayComplete(dayId: number): Promise<NewAchievement | null> {
  try {
    const earned = await prisma.achievement.findMany({ select: { key: true } });
    const earnedKeys = new Set(earned.map((a) => a.key));

    // first_day: any day complete
    if (!earnedKeys.has('first_day')) {
      const def = ACHIEVEMENTS.find((a) => a.key === 'first_day');
      if (def) {
        await prisma.achievement.create({
          data: { key: def.key, name: def.name, icon: def.icon },
        });
        return { key: def.key, title: def.name, icon: def.icon };
      }
    }

    // week_warrior: all non-skipped days in a week complete
    if (!earnedKeys.has('week_warrior')) {
      const day = await prisma.day.findUnique({
        where: { id: dayId },
        include: { week: { include: { days: true } } },
      });
      if (day?.week) {
        const nonSkipped = day.week.days.filter((d) => !(d as any).skipped);
        if (nonSkipped.length > 0 && nonSkipped.every((d) => d.isComplete)) {
          const def = ACHIEVEMENTS.find((a) => a.key === 'week_warrior');
          if (def) {
            await prisma.achievement.create({
              data: { key: def.key, name: def.name, icon: def.icon },
            });
            return { key: def.key, title: def.name, icon: def.icon };
          }
        }
      }
    }

    // streak_7 and streak_30
    const completedDays = await prisma.day.findMany({
      where: { completedAt: { not: null } },
      select: { completedAt: true },
    });
    const completionDates = completedDays
      .map((d) => d.completedAt)
      .filter((d): d is Date => d !== null);
    const streak = calculateStreak(completionDates, new Date());

    if (!earnedKeys.has('streak_7') && streak >= 7) {
      const def = ACHIEVEMENTS.find((a) => a.key === 'streak_7');
      if (def) {
        await prisma.achievement.create({
          data: { key: def.key, name: def.name, icon: def.icon },
        });
        return { key: def.key, title: def.name, icon: def.icon };
      }
    }

    if (!earnedKeys.has('streak_30') && streak >= 30) {
      const def = ACHIEVEMENTS.find((a) => a.key === 'streak_30');
      if (def) {
        await prisma.achievement.create({
          data: { key: def.key, name: def.name, icon: def.icon },
        });
        return { key: def.key, title: def.name, icon: def.icon };
      }
    }

    return null;
  } catch {
    return null;
  }
}

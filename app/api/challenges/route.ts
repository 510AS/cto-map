import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChallenges, Challenge } from '@/lib/challenges';
import { calculateStreak } from '@/lib/calculations';

/**
 * GET /api/challenges
 * Returns current week's challenges with progress.
 */
export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings?.startDate) {
      return NextResponse.json({ error: 'Start date not configured' }, { status: 404 });
    }

    const today = new Date();
    const startDate = new Date(settings.startDate);
    const elapsedDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.min(52, Math.max(1, Math.floor(elapsedDays / 7) + 1));

    const templates = generateChallenges(weekNumber);

    // Get current week data for progress calculation
    const currentWeek = await prisma.week.findUnique({
      where: { weekNumber },
      include: {
        days: { include: { taskItems: true } },
        reviewResponses: true,
      },
    });

    if (!currentWeek) {
      return NextResponse.json({ challenges: [] });
    }

    // Calculate progress for each challenge
    const challenges: Challenge[] = templates.map((template) => {
      let current = 0;

      switch (template.id) {
        case 'days_before_wed': {
          // Days completed (any day in the week)
          current = currentWeek.days.filter((d) => d.isComplete).length;
          break;
        }
        case 'log_hours': {
          current = currentWeek.hoursLogged ?? 0;
          break;
        }
        case 'write_reviews': {
          current = currentWeek.reviewResponses.length;
          break;
        }
        case 'add_resources': {
          const withResources = currentWeek.days
            .flatMap((d) => d.taskItems)
            .filter((t) => t.resourceUrl);
          current = withResources.length;
          break;
        }
        case 'maintain_streak': {
          // We'll use a simplified approach
          const completedDays = currentWeek.days.filter((d) => d.isComplete).length;
          current = completedDays;
          break;
        }
      }

      return { ...template, current: Math.min(current, template.target) };
    });

    return NextResponse.json({ challenges, weekNumber });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

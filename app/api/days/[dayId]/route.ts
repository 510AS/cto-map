import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAchievementsAfterDayComplete } from '@/lib/achievement-checker';

/**
 * PATCH /api/days/[dayId]
 * 
 * Supports multiple modes:
 * 1. Toggle entire day: { isComplete: boolean }
 * 2. Toggle individual task: { learnComplete?: boolean, buildComplete?: boolean }
 * 3. Skip day: { skipped: boolean }
 * 4. Set confidence: { confidence: number (1-5) }
 * 
 * Enhancement #12: After day completion, checks achievements and returns newAchievement if unlocked.
 * Enhancement #14: After day completion, updates active weekly challenges.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { dayId: string } }
) {
  try {
    const body = await req.json();
    const { isComplete, learnComplete, buildComplete, skipped, confidence, reflection } = body;

    const dayId = Number(params.dayId);
    if (isNaN(dayId)) {
      return NextResponse.json(
        { error: 'Invalid dayId' },
        { status: 400 }
      );
    }

    // Handle reflection
    if (typeof reflection === 'string') {
      const day = await prisma.day.update({
        where: { id: dayId },
        data: { reflection: reflection || null },
      });
      return NextResponse.json(day);
    }

    // Handle skip day
    if (typeof skipped === 'boolean') {
      const day = await prisma.day.update({
        where: { id: dayId },
        data: { skipped },
      });
      return NextResponse.json(day);
    }

    // Handle confidence rating
    if (typeof confidence === 'number') {
      if (confidence < 1 || confidence > 5) {
        return NextResponse.json(
          { error: 'Confidence must be between 1 and 5' },
          { status: 400 }
        );
      }
      const day = await prisma.day.update({
        where: { id: dayId },
        data: { confidence },
      });
      return NextResponse.json(day);
    }

    // Determine what to update
    let updateData: {
      isComplete?: boolean;
      learnComplete?: boolean;
      buildComplete?: boolean;
      completedAt?: Date | null;
    } = {};

    if (typeof learnComplete === 'boolean' || typeof buildComplete === 'boolean') {
      // Granular task completion mode
      const currentDay = await prisma.day.findUnique({ where: { id: dayId } });
      if (!currentDay) {
        return NextResponse.json({ error: 'Day not found' }, { status: 404 });
      }

      const newLearn = typeof learnComplete === 'boolean' ? learnComplete : currentDay.learnComplete;
      const newBuild = typeof buildComplete === 'boolean' ? buildComplete : currentDay.buildComplete;
      const bothComplete = newLearn && newBuild;

      updateData = {
        learnComplete: newLearn,
        buildComplete: newBuild,
        isComplete: bothComplete,
        completedAt: bothComplete ? new Date() : null,
      };
    } else if (typeof isComplete === 'boolean') {
      // Legacy whole-day toggle mode
      updateData = {
        isComplete,
        learnComplete: isComplete,
        buildComplete: isComplete,
        completedAt: isComplete ? new Date() : null,
      };
    } else {
      return NextResponse.json(
        { error: 'Must provide isComplete, learnComplete, buildComplete, skipped, or confidence' },
        { status: 400 }
      );
    }

    // Update the day
    const day = await prisma.day.update({
      where: { id: dayId },
      data: updateData,
    });

    // Check if all days in the week are complete to auto-complete the week
    const week = await prisma.week.findUnique({
      where: { id: day.weekId },
      include: { days: true },
    });

    let weekIsComplete = false;

    if (week) {
      const nonSkippedDays = week.days.filter((d) => !d.skipped);
      const allDaysComplete = nonSkippedDays.length > 0 && nonSkippedDays.every((d) => d.isComplete);

      if (allDaysComplete) {
        await prisma.week.update({
          where: { id: week.id },
          data: { isComplete: true },
        });
        weekIsComplete = true;
      } else {
        await prisma.week.update({
          where: { id: week.id },
          data: { isComplete: false },
        });
        weekIsComplete = false;
      }
    }

    // Enhancement #12: Check achievements after day completion
    let newAchievement = null;
    if (day.isComplete) {
      newAchievement = await checkAchievementsAfterDayComplete(dayId);
    }

    // Enhancement #14: Update weekly challenges after day completion
    if (day.isComplete && week) {
      await updateWeeklyChallenges(week.id);
    }

    return NextResponse.json({ ...day, weekIsComplete, newAchievement });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Enhancement #14: Update active weekly challenges after a day is completed.
 */
async function updateWeeklyChallenges(weekId: number) {
  try {
    const week = await prisma.week.findUnique({
      where: { id: weekId },
      include: {
        days: { include: { taskItems: true } },
        reviewResponses: true,
      },
    });

    if (!week) return;

    // Check if there are challenge records for this week
    const challenges = await (prisma as any).challenge?.findMany?.({
      where: { weekId, isComplete: false },
    });

    // If the challenge model doesn't exist, just return silently
    if (!challenges) return;

    for (const challenge of challenges) {
      let current = 0;

      switch (challenge.type) {
        case 'days_before_wed':
          current = week.days.filter((d) => d.isComplete).length;
          break;
        case 'log_hours':
          current = week.hoursLogged ?? 0;
          break;
        case 'write_reviews':
          current = week.reviewResponses.length;
          break;
        case 'add_resources':
          current = week.days
            .flatMap((d) => d.taskItems)
            .filter((t) => (t as any).resourceUrl).length;
          break;
        case 'maintain_streak':
          current = week.days.filter((d) => d.isComplete).length;
          break;
      }

      const isComplete = current >= challenge.target;
      await (prisma as any).challenge.update({
        where: { id: challenge.id },
        data: { current: Math.min(current, challenge.target), isComplete },
      });
    }
  } catch {
    // Silently fail — challenges are non-critical
  }
}

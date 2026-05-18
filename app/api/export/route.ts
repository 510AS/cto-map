import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/export
 * Generates a markdown portfolio file with:
 * - Summary stats
 * - Per-phase breakdown
 * - All build log entries
 * - All review responses
 * Returns as a downloadable .md file.
 */
export async function GET() {
  try {
    const [weeks, days, phases, settings] = await Promise.all([
      prisma.week.findMany({
        include: {
          buildLogEntry: true,
          reviewResponses: true,
          phase: true,
          days: { select: { isComplete: true, completedAt: true, skipped: true } },
        },
        orderBy: { weekNumber: 'asc' },
      }),
      prisma.day.findMany({
        where: { completedAt: { not: null } },
        select: { completedAt: true },
      }),
      prisma.phase.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.settings.findUnique({ where: { id: 1 } }),
    ]);

    const totalDaysCompleted = days.length;
    const totalHours = weeks.reduce((sum, w) => sum + (w.hoursLogged ?? 0), 0);
    const completedWeeks = weeks.filter((w) => w.isComplete).length;

    // Calculate streak
    const completionDates = days
      .map((d) => d.completedAt)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    if (completionDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let checkDate = new Date(today);

      for (const date of completionDates) {
        const dateStr = date.toISOString().split('T')[0];
        const checkStr = checkDate.toISOString().split('T')[0];
        if (dateStr === checkStr) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (date < checkDate) {
          break;
        }
      }
    }

    let md = `# CTO Learning Journey - Portfolio\n\n`;
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    md += `## Summary\n\n`;
    md += `| Metric | Value |\n|--------|-------|\n`;
    md += `| Days Completed | ${totalDaysCompleted} |\n`;
    md += `| Weeks Completed | ${completedWeeks}/52 |\n`;
    md += `| Total Hours | ${totalHours.toFixed(1)} |\n`;
    md += `| Current Streak | ${streak} days |\n`;
    if (settings?.startDate) {
      md += `| Started | ${settings.startDate.toISOString().split('T')[0]} |\n`;
    }
    md += `\n`;

    // Per-phase breakdown
    md += `## Phase Breakdown\n\n`;
    for (const phase of phases) {
      const phaseWeeks = weeks.filter((w) => w.phaseId === phase.id);
      const phaseCompleted = phaseWeeks.filter((w) => w.isComplete).length;
      md += `### ${phase.badge} ${phase.name}\n\n`;
      md += `Progress: ${phaseCompleted}/${phaseWeeks.length} weeks complete\n\n`;

      for (const w of phaseWeeks) {
        const status = w.isComplete ? '✅' : '⬜';
        md += `- ${status} Week ${w.weekNumber}: ${w.title}\n`;
      }
      md += `\n`;
    }

    // Build log entries
    const buildLogs = weeks.filter((w) => w.buildLogEntry);
    if (buildLogs.length > 0) {
      md += `## Build Log\n\n`;
      for (const w of buildLogs) {
        md += `### Week ${w.weekNumber}: ${w.title}\n\n`;
        md += `${w.buildLogEntry!.content}\n\n`;
      }
    }

    // Review responses
    const reviewWeeks = weeks.filter((w) => w.reviewResponses.length > 0);
    if (reviewWeeks.length > 0) {
      md += `## Weekly Reviews\n\n`;
      for (const w of reviewWeeks) {
        md += `### Week ${w.weekNumber}: ${w.title}\n\n`;
        for (const r of w.reviewResponses) {
          md += `**${r.prompt}:** ${r.response}\n\n`;
        }
      }
    }

    return new NextResponse(md, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': 'attachment; filename="cto-learning-portfolio.md"',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

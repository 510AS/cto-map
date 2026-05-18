import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { parseHtmlDataFile } from '../lib/seed-parser';

/**
 * Runs the seed logic against the provided PrismaClient instance.
 * Parses the HTML file and upserts all Phases, Weeks, Days, Tags, and WeekTags.
 * Returns the total number of weeks seeded.
 */
export async function runSeed(prisma: PrismaClient, htmlFilePath: string): Promise<number> {
  // Parse the HTML data
  const phases = parseHtmlDataFile(htmlFilePath);

  let totalWeeks = 0;

  for (const phase of phases) {
    // Upsert Phase
    const dbPhase = await prisma.phase.upsert({
      where: { name: phase.name },
      update: {
        badge: phase.badge,
        sortOrder: phase.sortOrder,
      },
      create: {
        name: phase.name,
        badge: phase.badge,
        sortOrder: phase.sortOrder,
      },
    });

    for (const week of phase.weeks) {
      // Upsert Week
      const dbWeek = await prisma.week.upsert({
        where: { weekNumber: week.weekNumber },
        update: {
          title: week.title,
          goal: week.goal,
          saasEvolution: week.saasEvolution,
          phaseId: dbPhase.id,
        },
        create: {
          weekNumber: week.weekNumber,
          title: week.title,
          goal: week.goal,
          saasEvolution: week.saasEvolution,
          phaseId: dbPhase.id,
        },
      });

      // Upsert Days for each week
      for (const day of week.days) {
        await prisma.day.upsert({
          where: {
            weekId_sortOrder: {
              weekId: dbWeek.id,
              sortOrder: day.sortOrder,
            },
          },
          update: {
            dayLabel: day.dayLabel,
            learnTask: day.learnTask,
            buildTask: day.buildTask,
          },
          create: {
            dayLabel: day.dayLabel,
            learnTask: day.learnTask,
            buildTask: day.buildTask,
            sortOrder: day.sortOrder,
            weekId: dbWeek.id,
          },
        });
      }

      // Upsert Tags and create WeekTag relations
      for (const tagName of week.tags) {
        const dbTag = await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });

        await prisma.weekTag.upsert({
          where: {
            weekId_tagId: {
              weekId: dbWeek.id,
              tagId: dbTag.id,
            },
          },
          update: {},
          create: {
            weekId: dbWeek.id,
            tagId: dbTag.id,
          },
        });
      }

      totalWeeks++;
    }
  }

  return totalWeeks;
}

// CLI entry point — only runs when executed directly
if (require.main === module) {
  const prisma = new PrismaClient();

  async function main() {
    // Resolve HTML file path from env var or default
    const htmlFilePath = process.env.SEED_HTML_PATH
      ?? path.resolve(__dirname, '..', '..', 'technical_cto_mastery_final.html');

    console.log(`Seeding from: ${htmlFilePath}`);

    const totalWeeks = await runSeed(prisma, htmlFilePath);
    const phases = parseHtmlDataFile(htmlFilePath);

    console.log(`Seeded ${totalWeeks} weeks across ${phases.length} phases.`);
  }

  main()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('Error:', error.message ?? error);
      await prisma.$disconnect();
      process.exit(1);
    });
}

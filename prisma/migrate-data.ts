/**
 * One-time migration script: SQLite → PostgreSQL
 * Reads all data from the old dev.db and inserts into the new PostgreSQL database.
 *
 * Usage: npx tsx prisma/migrate-data.ts
 */

import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';

const sqliteDbPath = path.resolve(__dirname, 'dev.db');
const sqlite = new Database(sqliteDbPath, { readonly: true });
const prisma = new PrismaClient();

async function migrate() {
  console.log(`Reading from SQLite: ${sqliteDbPath}`);
  console.log(`Writing to PostgreSQL: ${process.env.DATABASE_URL?.split('@')[1] || 'configured DB'}\n`);

  // Ensure UTF-8 encoding for emoji support
  await prisma.$executeRawUnsafe("SET client_encoding TO 'UTF8'");

  // 1. Migrate Settings
  const settings = sqlite.prepare('SELECT * FROM Settings').all() as any[];
  for (const s of settings) {
    await prisma.settings.upsert({
      where: { id: s.id },
      update: { startDate: s.startDate ? new Date(s.startDate) : null, xp: s.xp ?? 0 },
      create: { id: s.id, startDate: s.startDate ? new Date(s.startDate) : null, xp: s.xp ?? 0 },
    });
  }
  console.log(`✓ Settings: ${settings.length} rows`);

  // 2. Migrate Phases
  const phases = sqlite.prepare('SELECT * FROM Phase').all() as any[];
  for (const p of phases) {
    await prisma.phase.upsert({
      where: { id: p.id },
      update: { name: p.name, badge: p.badge, sortOrder: p.sortOrder },
      create: { id: p.id, name: p.name, badge: p.badge, sortOrder: p.sortOrder },
    });
  }
  console.log(`✓ Phases: ${phases.length} rows`);

  // 3. Migrate Weeks
  const weeks = sqlite.prepare('SELECT * FROM Week').all() as any[];
  for (const w of weeks) {
    await prisma.week.upsert({
      where: { id: w.id },
      update: {
        weekNumber: w.weekNumber,
        title: w.title,
        goal: w.goal,
        saasEvolution: w.saasEvolution,
        isComplete: Boolean(w.isComplete),
        hoursLogged: w.hoursLogged,
        note: w.note,
        phaseId: w.phaseId,
      },
      create: {
        id: w.id,
        weekNumber: w.weekNumber,
        title: w.title,
        goal: w.goal,
        saasEvolution: w.saasEvolution,
        isComplete: Boolean(w.isComplete),
        hoursLogged: w.hoursLogged,
        note: w.note,
        phaseId: w.phaseId,
      },
    });
  }
  console.log(`✓ Weeks: ${weeks.length} rows`);

  // 4. Migrate Days
  const days = sqlite.prepare('SELECT * FROM Day').all() as any[];
  for (const d of days) {
    await prisma.day.upsert({
      where: { weekId_sortOrder: { weekId: d.weekId, sortOrder: d.sortOrder } },
      update: {
        dayLabel: d.dayLabel,
        learnTask: d.learnTask,
        buildTask: d.buildTask,
        isComplete: Boolean(d.isComplete),
        learnComplete: Boolean(d.learnComplete),
        buildComplete: Boolean(d.buildComplete),
        skipped: Boolean(d.skipped),
        confidence: d.confidence,
        completedAt: d.completedAt ? new Date(d.completedAt) : null,
        note: d.note,
        reflection: d.reflection,
      },
      create: {
        id: d.id,
        dayLabel: d.dayLabel,
        learnTask: d.learnTask,
        buildTask: d.buildTask,
        sortOrder: d.sortOrder,
        isComplete: Boolean(d.isComplete),
        learnComplete: Boolean(d.learnComplete),
        buildComplete: Boolean(d.buildComplete),
        skipped: Boolean(d.skipped),
        confidence: d.confidence,
        completedAt: d.completedAt ? new Date(d.completedAt) : null,
        note: d.note,
        reflection: d.reflection,
        weekId: d.weekId,
      },
    });
  }
  console.log(`✓ Days: ${days.length} rows`);

  // 5. Migrate TaskItems
  const taskItems = sqlite.prepare('SELECT * FROM TaskItem').all() as any[];
  for (const t of taskItems) {
    await prisma.taskItem.upsert({
      where: { id: t.id },
      update: {
        title: t.title,
        category: t.category,
        isComplete: Boolean(t.isComplete),
        sortOrder: t.sortOrder,
        timeEstimate: t.timeEstimate,
        note: t.note,
        resourceUrl: t.resourceUrl,
        priority: t.priority,
        actualMinutes: t.actualMinutes,
        dayId: t.dayId,
      },
      create: {
        id: t.id,
        title: t.title,
        category: t.category,
        isComplete: Boolean(t.isComplete),
        sortOrder: t.sortOrder,
        timeEstimate: t.timeEstimate,
        note: t.note,
        resourceUrl: t.resourceUrl,
        priority: t.priority,
        actualMinutes: t.actualMinutes,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        dayId: t.dayId,
      },
    });
  }
  console.log(`✓ TaskItems: ${taskItems.length} rows`);

  // 6. Migrate Tags
  const tags = sqlite.prepare('SELECT * FROM Tag').all() as any[];
  for (const t of tags) {
    await prisma.tag.upsert({
      where: { id: t.id },
      update: { name: t.name },
      create: { id: t.id, name: t.name },
    });
  }
  console.log(`✓ Tags: ${tags.length} rows`);

  // 7. Migrate WeekTags
  const weekTags = sqlite.prepare('SELECT * FROM WeekTag').all() as any[];
  for (const wt of weekTags) {
    await prisma.weekTag.upsert({
      where: { weekId_tagId: { weekId: wt.weekId, tagId: wt.tagId } },
      update: {},
      create: { weekId: wt.weekId, tagId: wt.tagId },
    });
  }
  console.log(`✓ WeekTags: ${weekTags.length} rows`);

  // 8. Migrate BuildLogEntries
  const buildLogs = sqlite.prepare('SELECT * FROM BuildLogEntry').all() as any[];
  for (const b of buildLogs) {
    await prisma.buildLogEntry.upsert({
      where: { weekId: b.weekId },
      update: { content: b.content },
      create: { id: b.id, content: b.content, weekId: b.weekId },
    });
  }
  console.log(`✓ BuildLogEntries: ${buildLogs.length} rows`);

  // 9. Migrate Bookmarks
  const bookmarks = sqlite.prepare('SELECT * FROM Bookmark').all() as any[];
  for (const b of bookmarks) {
    await prisma.bookmark.upsert({
      where: { id: b.id },
      update: { url: b.url, label: b.label, weekId: b.weekId, tagId: b.tagId },
      create: {
        id: b.id,
        url: b.url,
        label: b.label,
        weekId: b.weekId,
        tagId: b.tagId,
        createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
      },
    });
  }
  console.log(`✓ Bookmarks: ${bookmarks.length} rows`);

  // 10. Migrate ReviewResponses
  const reviews = sqlite.prepare('SELECT * FROM ReviewResponse').all() as any[];
  for (const r of reviews) {
    await prisma.reviewResponse.upsert({
      where: { weekId_prompt: { weekId: r.weekId, prompt: r.prompt } },
      update: { response: r.response },
      create: { id: r.id, weekId: r.weekId, prompt: r.prompt, response: r.response },
    });
  }
  console.log(`✓ ReviewResponses: ${reviews.length} rows`);

  // 11. Migrate ReviewReminders
  const reminders = sqlite.prepare('SELECT * FROM ReviewReminder').all() as any[];
  for (const r of reminders) {
    await prisma.reviewReminder.upsert({
      where: { id: r.id },
      update: {
        weekId: r.weekId,
        nextReview: new Date(r.nextReview),
        interval: r.interval,
        confidence: r.confidence,
      },
      create: {
        id: r.id,
        weekId: r.weekId,
        nextReview: new Date(r.nextReview),
        interval: r.interval ?? 1,
        confidence: r.confidence ?? 3,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      },
    });
  }
  console.log(`✓ ReviewReminders: ${reminders.length} rows`);

  // 12. Migrate Achievements
  const achievements = sqlite.prepare('SELECT * FROM Achievement').all() as any[];
  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { key: a.key },
      update: { name: a.name, icon: a.icon },
      create: {
        id: a.id,
        key: a.key,
        name: a.name,
        icon: a.icon,
        earnedAt: a.earnedAt ? new Date(a.earnedAt) : new Date(),
      },
    });
  }
  console.log(`✓ Achievements: ${achievements.length} rows`);

  // 13. Migrate WeeklyChallenges
  const challenges = sqlite.prepare('SELECT * FROM WeeklyChallenge').all() as any[];
  for (const c of challenges) {
    await prisma.weeklyChallenge.upsert({
      where: { id: c.id },
      update: {
        weekNumber: c.weekNumber,
        title: c.title,
        target: c.target,
        current: c.current,
        isComplete: Boolean(c.isComplete),
      },
      create: {
        id: c.id,
        weekNumber: c.weekNumber,
        title: c.title,
        target: c.target,
        current: c.current ?? 0,
        isComplete: Boolean(c.isComplete),
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
      },
    });
  }
  console.log(`✓ WeeklyChallenges: ${challenges.length} rows`);

  // Reset PostgreSQL sequences to match the max IDs
  console.log('\nResetting sequences...');
  const sequences = [
    { table: 'Phase', column: 'id' },
    { table: 'Week', column: 'id' },
    { table: 'Day', column: 'id' },
    { table: 'TaskItem', column: 'id' },
    { table: 'Tag', column: 'id' },
    { table: 'BuildLogEntry', column: 'id' },
    { table: 'Bookmark', column: 'id' },
    { table: 'ReviewResponse', column: 'id' },
    { table: 'ReviewReminder', column: 'id' },
    { table: 'Achievement', column: 'id' },
    { table: 'WeeklyChallenge', column: 'id' },
  ];

  for (const seq of sequences) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${seq.table}"', '${seq.column}'), COALESCE((SELECT MAX("${seq.column}") FROM "${seq.table}"), 0) + 1, false)`
      );
    } catch (e) {
      // Some tables might be empty, that's fine
    }
  }
  console.log('✓ Sequences reset');

  console.log('\n🎉 Migration complete!');
}

migrate()
  .then(async () => {
    sqlite.close();
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('\n❌ Migration failed:', error.message ?? error);
    sqlite.close();
    await prisma.$disconnect();
    process.exit(1);
  });

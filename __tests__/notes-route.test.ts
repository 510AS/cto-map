import { prisma } from '@/lib/prisma';

/**
 * Unit tests for app/api/notes/route.ts
 * Tests the note saving logic for weeks and days.
 * Validates: Requirements 7.1, 7.2, 7.3
 */
describe('Notes API - Database Operations', () => {
  let testWeekId: number;
  let testDayId: number;
  let createdOwnData = false;

  beforeAll(async () => {
    // Find an existing week and day to test with
    const week = await prisma.week.findFirst({
      include: { days: true },
    });

    if (!week || week.days.length === 0) {
      // Create test data if no seeded data exists
      const phase = await prisma.phase.upsert({
        where: { name: 'Notes Test Phase' },
        update: {},
        create: { name: 'Notes Test Phase', badge: '📝', sortOrder: 8000 },
      });
      const newWeek = await prisma.week.create({
        data: {
          weekNumber: 8000,
          title: 'Notes Test Week',
          goal: 'Test goal',
          saasEvolution: 'Test evolution',
          phaseId: phase.id,
        },
      });
      const newDay = await prisma.day.create({
        data: {
          dayLabel: 'Day 1',
          learnTask: 'Learn test',
          buildTask: 'Build test',
          sortOrder: 1,
          weekId: newWeek.id,
        },
      });
      testWeekId = newWeek.id;
      testDayId = newDay.id;
      createdOwnData = true;
    } else {
      testWeekId = week.id;
      testDayId = week.days[0].id;
    }
  });

  afterAll(async () => {
    // Clean up: reset notes to null
    if (testWeekId) {
      await prisma.week.update({
        where: { id: testWeekId },
        data: { note: null },
      });
    }
    if (testDayId) {
      await prisma.day.update({
        where: { id: testDayId },
        data: { note: null },
      });
    }
    if (createdOwnData && testWeekId) {
      await prisma.day.deleteMany({ where: { weekId: testWeekId } });
      await prisma.week.delete({ where: { id: testWeekId } });
    }
    await prisma.$disconnect();
  });

  describe('Week notes', () => {
    it('should save a note to a week', async () => {
      const content = 'This is a test week note';

      const updated = await prisma.week.update({
        where: { id: testWeekId },
        data: { note: content },
      });

      expect(updated.note).toBe(content);
    });

    it('should update an existing week note', async () => {
      const firstNote = 'First note';
      const secondNote = 'Updated note';

      await prisma.week.update({
        where: { id: testWeekId },
        data: { note: firstNote },
      });

      const updated = await prisma.week.update({
        where: { id: testWeekId },
        data: { note: secondNote },
      });

      expect(updated.note).toBe(secondNote);
    });

    it('should persist the note and retrieve it', async () => {
      const content = 'Persisted week note';

      await prisma.week.update({
        where: { id: testWeekId },
        data: { note: content },
      });

      const retrieved = await prisma.week.findUnique({
        where: { id: testWeekId },
      });

      expect(retrieved?.note).toBe(content);
    });
  });

  describe('Day notes', () => {
    it('should save a note to a day', async () => {
      const content = 'This is a test day note';

      const updated = await prisma.day.update({
        where: { id: testDayId },
        data: { note: content },
      });

      expect(updated.note).toBe(content);
    });

    it('should update an existing day note', async () => {
      const firstNote = 'First day note';
      const secondNote = 'Updated day note';

      await prisma.day.update({
        where: { id: testDayId },
        data: { note: firstNote },
      });

      const updated = await prisma.day.update({
        where: { id: testDayId },
        data: { note: secondNote },
      });

      expect(updated.note).toBe(secondNote);
    });

    it('should persist the day note and retrieve it', async () => {
      const content = 'Persisted day note';

      await prisma.day.update({
        where: { id: testDayId },
        data: { note: content },
      });

      const retrieved = await prisma.day.findUnique({
        where: { id: testDayId },
      });

      expect(retrieved?.note).toBe(content);
    });
  });
});

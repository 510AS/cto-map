/**
 * Property-based test for note round-trip.
 *
 * Feature: cto-learning-helper, Property 13: Note Round-Trip
 *
 * **Validates: Requirements 7.3**
 *
 * For any non-empty note text T saved to a week W or day D, subsequently loading
 * W or D from the database SHALL return T as the note value.
 *
 * Uses fast-check with arbitrary non-empty strings; saves them as week notes and
 * day notes, then re-reads and asserts the content matches exactly.
 */

import * as fc from 'fast-check';
import { prisma } from '@/lib/prisma';

describe('Property 13: Note Round-Trip', () => {
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
        where: { name: 'Note Round-Trip Test Phase' },
        update: {},
        create: { name: 'Note Round-Trip Test Phase', badge: '📝', sortOrder: 8001 },
      });
      const newWeek = await prisma.week.create({
        data: {
          weekNumber: 8001,
          title: 'Note Round-Trip Test Week',
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

  /**
   * **Validates: Requirements 7.3**
   *
   * For any non-empty string saved as a week note, re-reading the week
   * from the database returns the exact same note content.
   */
  it('should persist and retrieve arbitrary week notes exactly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 5000 }),
        async (noteContent) => {
          // Save the note to the week
          await prisma.week.update({
            where: { id: testWeekId },
            data: { note: noteContent },
          });

          // Re-read the week from the database
          const retrieved = await prisma.week.findUnique({
            where: { id: testWeekId },
          });

          // Assert the note matches exactly
          expect(retrieved?.note).toBe(noteContent);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 7.3**
   *
   * For any non-empty string saved as a day note, re-reading the day
   * from the database returns the exact same note content.
   */
  it('should persist and retrieve arbitrary day notes exactly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 5000 }),
        async (noteContent) => {
          // Save the note to the day
          await prisma.day.update({
            where: { id: testDayId },
            data: { note: noteContent },
          });

          // Re-read the day from the database
          const retrieved = await prisma.day.findUnique({
            where: { id: testDayId },
          });

          // Assert the note matches exactly
          expect(retrieved?.note).toBe(noteContent);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 7.3**
   *
   * For any non-empty string containing special characters (unicode, newlines,
   * tabs, etc.), the round-trip through the database preserves the content exactly.
   */
  it('should handle unicode and special characters in notes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.unicodeString({ minLength: 1, maxLength: 2000 }),
        async (noteContent) => {
          // Save to week
          await prisma.week.update({
            where: { id: testWeekId },
            data: { note: noteContent },
          });

          const retrieved = await prisma.week.findUnique({
            where: { id: testWeekId },
          });

          expect(retrieved?.note).toBe(noteContent);
        }
      ),
      { numRuns: 10 }
    );
  });
});

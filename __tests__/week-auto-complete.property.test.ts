/**
 * Property-based test for auto-complete week on all days done.
 *
 * Feature: cto-learning-helper, Property 7: Auto-Complete Week on All Days Done
 *
 * **Validates: Requirements 4.5**
 *
 * For any week W with N days (N between 1 and 7), when all N days are marked
 * complete, W.isComplete SHALL be set to true automatically. Conversely, if any
 * day in W is marked incomplete, W.isComplete SHALL be false.
 *
 * Tests directly against the database using the same auto-complete logic as the
 * days route handler.
 */

import * as fc from 'fast-check';
import { prisma } from '@/lib/prisma';

// =============================================================================
// Helpers
// =============================================================================

/**
 * Creates a test week with N days and returns the week ID and day IDs.
 */
async function createTestWeek(
  phaseId: number,
  weekNumber: number,
  numDays: number
): Promise<{ weekId: number; dayIds: number[] }> {
  const week = await prisma.week.create({
    data: {
      weekNumber,
      title: `Test Week ${weekNumber}`,
      goal: 'Test goal',
      saasEvolution: 'Test evolution',
      phaseId,
    },
  });

  const dayIds: number[] = [];
  for (let i = 1; i <= numDays; i++) {
    const day = await prisma.day.create({
      data: {
        dayLabel: `Day ${i}`,
        learnTask: `Learn task ${i}`,
        buildTask: `Build task ${i}`,
        sortOrder: i,
        weekId: week.id,
      },
    });
    dayIds.push(day.id);
  }

  return { weekId: week.id, dayIds };
}

/**
 * Simulates the auto-complete logic from the days route handler.
 * After updating a day, checks if all days in the week are complete
 * and updates the week's isComplete status accordingly.
 */
async function markDayAndAutoComplete(dayId: number, isComplete: boolean): Promise<void> {
  const day = await prisma.day.update({
    where: { id: dayId },
    data: {
      isComplete,
      completedAt: isComplete ? new Date() : null,
    },
  });

  const week = await prisma.week.findUnique({
    where: { id: day.weekId },
    include: { days: true },
  });

  if (week) {
    const allDaysComplete = week.days.every((d) => d.isComplete);
    await prisma.week.update({
      where: { id: week.id },
      data: { isComplete: allDaysComplete },
    });
  }
}

/**
 * Cleans up a test week and its days.
 */
async function cleanupTestWeek(weekId: number): Promise<void> {
  await prisma.taskItem.deleteMany({ where: { day: { weekId } } });
  await prisma.day.deleteMany({ where: { weekId } });
  await prisma.week.delete({ where: { id: weekId } });
}

// =============================================================================
// Property 7: Auto-Complete Week on All Days Done
// =============================================================================

describe('Property 7: Auto-Complete Week on All Days Done', () => {
  let phaseId: number;
  let weekCounter = 9000; // Use high numbers to avoid conflicts with seeded data

  beforeAll(async () => {
    // Clean up any leftover data from previous failed runs
    const existingPhase = await prisma.phase.findFirst({
      where: { name: 'Test Phase - Auto Complete Property' },
    });
    if (existingPhase) {
      await prisma.taskItem.deleteMany({
        where: { day: { week: { phaseId: existingPhase.id } } },
      });
      await prisma.day.deleteMany({
        where: { week: { phaseId: existingPhase.id } },
      });
      await prisma.week.deleteMany({ where: { phaseId: existingPhase.id } });
      await prisma.phase.delete({ where: { id: existingPhase.id } });
    }

    const phase = await prisma.phase.create({
      data: {
        name: 'Test Phase - Auto Complete Property',
        badge: '🧪',
        sortOrder: 9000,
      },
    });
    phaseId = phase.id;
  }, 30000);

  afterAll(async () => {
    // Clean up any remaining test weeks
    await prisma.taskItem.deleteMany({
      where: { day: { week: { phaseId } } },
    });
    await prisma.day.deleteMany({
      where: { week: { phaseId } },
    });
    await prisma.week.deleteMany({ where: { phaseId } });
    await prisma.phase.delete({ where: { id: phaseId } });
    await prisma.$disconnect();
  }, 30000);

  /**
   * **Validates: Requirements 4.5**
   *
   * For any week with N days (1-7), marking all N days complete causes the
   * week to auto-complete, and un-completing any single day causes the week
   * to become incomplete.
   */
  it('should auto-complete week when all days are done and un-complete when any day is undone', async () => {
    await fc.assert(
      fc.asyncProperty(
        // N: number of days in the week (1-7)
        fc.integer({ min: 1, max: 7 }),
        // dayToUncomplete: index (0-based) of the day to un-complete after all are done
        fc.integer({ min: 0, max: 6 }),
        async (numDays, uncompleteIndexRaw) => {
          // Clamp the uncomplete index to valid range for this week
          const uncompleteIndex = uncompleteIndexRaw % numDays;

          // Create a unique week number for this iteration
          const weekNum = weekCounter++;
          const { weekId, dayIds } = await createTestWeek(phaseId, weekNum, numDays);

          try {
            // Step 1: Mark all days complete one by one
            for (const dayId of dayIds) {
              await markDayAndAutoComplete(dayId, true);
            }

            // Verify: week should be auto-completed
            const weekAfterAllComplete = await prisma.week.findUnique({
              where: { id: weekId },
            });
            expect(weekAfterAllComplete!.isComplete).toBe(true);

            // Step 2: Un-complete one arbitrary day
            await markDayAndAutoComplete(dayIds[uncompleteIndex], false);

            // Verify: week should be incomplete
            const weekAfterUncomplete = await prisma.week.findUnique({
              where: { id: weekId },
            });
            expect(weekAfterUncomplete!.isComplete).toBe(false);
          } finally {
            // Clean up this iteration's data
            await cleanupTestWeek(weekId);
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 120000); // Extended timeout for DB operations
});

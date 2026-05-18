/**
 * Property-based test for day completion independence.
 *
 * Feature: cto-learning-helper, Property 6: Day Completion Independence
 *
 * **Validates: Requirements 4.3**
 *
 * For any two distinct days D1 and D2 within the same week, toggling the
 * completion state of D1 SHALL NOT change the completion state of D2.
 *
 * Tests directly against the database using fast-check to generate arbitrary
 * toggle sequences and verify that toggling one day never changes another day's state.
 */

import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

// =============================================================================
// Test Database Setup
// =============================================================================

const TEST_DB_PATH = path.resolve(__dirname, '..', 'prisma', 'test-day-independence.db');
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

let prisma: PrismaClient;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Simulates the day toggle logic from the PATCH /api/days/[dayId] route handler.
 * Updates the day's completion state and handles auto-complete/un-complete of the week.
 */
async function toggleDay(dayId: number, isComplete: boolean): Promise<void> {
  const day = await prisma.day.update({
    where: { id: dayId },
    data: {
      isComplete,
      completedAt: isComplete ? new Date() : null,
    },
  });

  // Auto-complete week logic (mirrors the route handler)
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

// =============================================================================
// Test Setup
// =============================================================================

describe('Property 6: Day Completion Independence', () => {
  let phaseId: number;
  let weekId: number;
  let dayIds: number[];
  const NUM_DAYS = 5;

  beforeAll(async () => {
    // @ts-ignore - extended timeout for DB setup
    // Remove test DB if it exists from a previous run
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // Push the schema to create the test database
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      cwd: path.resolve(__dirname, '..'),
      env: {
        ...process.env,
        DATABASE_URL: TEST_DB_URL,
      },
      stdio: 'pipe',
    });

    // Create a PrismaClient pointing to the test database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: TEST_DB_URL,
        },
      },
    });

    // Create a test phase
    const phase = await prisma.phase.create({
      data: {
        name: 'Test Phase - Day Independence',
        badge: '🧪',
        sortOrder: 900,
      },
    });
    phaseId = phase.id;

    // Create a test week
    const week = await prisma.week.create({
      data: {
        weekNumber: 900,
        title: 'Test Week - Day Independence',
        goal: 'Test goal',
        saasEvolution: 'Test evolution',
        phaseId: phase.id,
      },
    });
    weekId = week.id;

    // Create multiple days in the week
    dayIds = [];
    for (let i = 1; i <= NUM_DAYS; i++) {
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
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();

    // Clean up test database file
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  // Reset all days to incomplete before each test iteration
  beforeEach(async () => {
    await prisma.day.updateMany({
      where: { weekId },
      data: { isComplete: false, completedAt: null },
    });
    await prisma.week.update({
      where: { id: weekId },
      data: { isComplete: false },
    });
  });

  /**
   * **Validates: Requirements 4.3**
   *
   * For arbitrary pairs of distinct days in the same week, assert toggling D1
   * does not change D2's state. Uses fast-check to generate arbitrary toggle
   * sequences and verify independence.
   */
  it('toggling D1 should not change D2 state for arbitrary distinct day pairs', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two distinct day indices (0 to NUM_DAYS-1)
        fc.integer({ min: 0, max: NUM_DAYS - 1 }),
        fc.integer({ min: 0, max: NUM_DAYS - 1 }),
        // Generate the initial state for D2 (true = complete, false = incomplete)
        fc.boolean(),
        // Generate the toggle value for D1
        fc.boolean(),
        async (d1Index, d2Index, d2InitialState, d1ToggleValue) => {
          // Ensure D1 and D2 are distinct
          fc.pre(d1Index !== d2Index);

          const d1Id = dayIds[d1Index];
          const d2Id = dayIds[d2Index];

          // Reset all days first
          await prisma.day.updateMany({
            where: { weekId },
            data: { isComplete: false, completedAt: null },
          });

          // Set D2 to its initial state
          await prisma.day.update({
            where: { id: d2Id },
            data: {
              isComplete: d2InitialState,
              completedAt: d2InitialState ? new Date() : null,
            },
          });

          // Record D2's state before toggling D1
          const d2Before = await prisma.day.findUnique({ where: { id: d2Id } });
          const d2StateBefore = d2Before!.isComplete;

          // Toggle D1 using the route handler logic
          await toggleDay(d1Id, d1ToggleValue);

          // Read D2's state after toggling D1
          const d2After = await prisma.day.findUnique({ where: { id: d2Id } });
          const d2StateAfter = d2After!.isComplete;

          // Assert D2's completion state is unchanged
          expect(d2StateAfter).toBe(d2StateBefore);
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);
});

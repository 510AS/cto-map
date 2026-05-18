/**
 * Property-based test for completion persistence.
 *
 * Feature: cto-learning-helper, Property 8: Completion Persistence
 *
 * **Validates: Requirements 5.5**
 *
 * For any set of day and week completion states written to the database,
 * re-reading those records from the database SHALL return the same completion states.
 *
 * Uses fast-check to generate arbitrary boolean completion states for weeks,
 * writes them to the DB, then re-reads and asserts they match.
 */

import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import * as fc from 'fast-check';

// Use a separate test database file
const TEST_DB_PATH = path.resolve(__dirname, '..', 'prisma', 'test-completion-persistence.db');
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

describe('Property 8: Completion Persistence', () => {
  let prisma: PrismaClient;
  let weekIds: number[] = [];
  let dayIds: number[] = [];

  beforeAll(async () => {
    // Remove test DB if it exists from a previous run
    const journalPath = TEST_DB_PATH + '-journal';
    for (const filePath of [journalPath, TEST_DB_PATH]) {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e: any) {
          // On Windows, file may be locked briefly; wait and retry
          if (e.code === 'EBUSY' || e.code === 'EPERM') {
            await new Promise(r => setTimeout(r, 1000));
            try { fs.unlinkSync(filePath); } catch { /* ignore if still locked */ }
          }
        }
      }
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

    // Seed test data: create a phase with multiple weeks, each with multiple days
    const phase = await prisma.phase.create({
      data: {
        name: 'Persistence Test Phase',
        badge: '🧪',
        sortOrder: 1,
      },
    });

    // Create 10 weeks with 5 days each to have enough data for property testing
    for (let w = 1; w <= 10; w++) {
      const week = await prisma.week.create({
        data: {
          weekNumber: w,
          title: `Week ${w}`,
          goal: `Goal ${w}`,
          saasEvolution: `Evolution ${w}`,
          isComplete: false,
          phaseId: phase.id,
        },
      });
      weekIds.push(week.id);

      for (let d = 1; d <= 5; d++) {
        const day = await prisma.day.create({
          data: {
            dayLabel: `Day ${d}`,
            learnTask: `Learn task ${d}`,
            buildTask: `Build task ${d}`,
            sortOrder: d,
            isComplete: false,
            weekId: week.id,
          },
        });
        dayIds.push(day.id);
      }
    }
  }, 120000);

  afterAll(async () => {
    await prisma.$disconnect();

    // Clean up test database file
    const journalPath = TEST_DB_PATH + '-journal';
    for (const filePath of [journalPath, TEST_DB_PATH]) {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch { /* ignore cleanup errors */ }
      }
    }
  });

  /**
   * **Validates: Requirements 5.5**
   *
   * Write arbitrary week completion states to the database; re-read and assert they match.
   */
  it('should persist arbitrary week completion states correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate an array of 10 booleans (one per week)
        fc.array(fc.boolean(), { minLength: 10, maxLength: 10 }),
        async (completionStates) => {
          // Write completion states to the database
          for (let i = 0; i < weekIds.length; i++) {
            await prisma.week.update({
              where: { id: weekIds[i] },
              data: { isComplete: completionStates[i] },
            });
          }

          // Re-read all weeks and assert they match
          for (let i = 0; i < weekIds.length; i++) {
            const week = await prisma.week.findUnique({
              where: { id: weekIds[i] },
            });
            expect(week).not.toBeNull();
            expect(week!.isComplete).toBe(completionStates[i]);
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);

  /**
   * **Validates: Requirements 5.5**
   *
   * Write arbitrary day completion states to the database; re-read and assert they match.
   */
  it('should persist arbitrary day completion states correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate an array of 50 booleans (one per day, 10 weeks × 5 days)
        fc.array(fc.boolean(), { minLength: 50, maxLength: 50 }),
        async (completionStates) => {
          // Write completion states to the database
          for (let i = 0; i < dayIds.length; i++) {
            await prisma.day.update({
              where: { id: dayIds[i] },
              data: {
                isComplete: completionStates[i],
                completedAt: completionStates[i] ? new Date() : null,
              },
            });
          }

          // Re-read all days and assert they match
          for (let i = 0; i < dayIds.length; i++) {
            const day = await prisma.day.findUnique({
              where: { id: dayIds[i] },
            });
            expect(day).not.toBeNull();
            expect(day!.isComplete).toBe(completionStates[i]);
            // Also verify completedAt consistency
            if (completionStates[i]) {
              expect(day!.completedAt).not.toBeNull();
            } else {
              expect(day!.completedAt).toBeNull();
            }
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 180000);
});

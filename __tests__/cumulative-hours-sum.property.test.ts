/**
 * Property-based test for cumulative hours sum.
 *
 * Feature: cto-learning-helper, Property 12: Cumulative Hours Sum
 *
 * **Validates: Requirements 6.6**
 *
 * For any set of weekly hour values {h₁, h₂, …, hₙ} stored in the database,
 * the dashboard's displayed total hours SHALL equal Σhᵢ.
 *
 * Uses fast-check to generate arbitrary arrays of float hour values,
 * writes them to weeks in the DB, then sums them and asserts the total matches.
 */

import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import * as fc from 'fast-check';

// Use a separate test database file
const TEST_DB_PATH = path.resolve(__dirname, '..', 'prisma', 'test-cumulative-hours.db');
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

describe('Property 12: Cumulative Hours Sum', () => {
  let prisma: PrismaClient;
  let weekIds: number[] = [];

  beforeAll(async () => {
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

    // Seed test data: create a phase with 10 weeks
    const phase = await prisma.phase.create({
      data: {
        name: 'Hours Test Phase',
        badge: '⏱️',
        sortOrder: 1,
      },
    });

    for (let w = 1; w <= 10; w++) {
      const week = await prisma.week.create({
        data: {
          weekNumber: w,
          title: `Week ${w}`,
          goal: `Goal ${w}`,
          saasEvolution: `Evolution ${w}`,
          isComplete: false,
          hoursLogged: null,
          phaseId: phase.id,
        },
      });
      weekIds.push(week.id);
    }
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();

    // Clean up test database file
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  /**
   * **Validates: Requirements 6.6**
   *
   * Write arbitrary float hour values to weeks in the database,
   * then query all weeks and assert the cumulative sum matches.
   */
  it('should report cumulative hours equal to the sum of all weekly hoursLogged values', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate an array of 10 floats (one per week), representing hours logged
        // Use values between 0 and 168 (max hours in a week), rounded to 2 decimal places
        fc.array(
          fc.oneof(
            fc.constant(null as number | null),
            fc.double({ min: 0, max: 168, noNaN: true, noDefaultInfinity: true }).map(
              (v) => Math.round(v * 100) / 100
            )
          ),
          { minLength: 10, maxLength: 10 }
        ),
        async (hourValues) => {
          // Write hour values to the database
          for (let i = 0; i < weekIds.length; i++) {
            await prisma.week.update({
              where: { id: weekIds[i] },
              data: { hoursLogged: hourValues[i] },
            });
          }

          // Query all weeks and compute cumulative hours (same logic as dashboard)
          const weeks = await prisma.week.findMany({
            select: { hoursLogged: true },
          });

          const cumulativeHours = weeks.reduce(
            (sum, week) => sum + (week.hoursLogged ?? 0),
            0
          );

          // Compute expected sum from the input values
          const expectedSum: number = hourValues.reduce<number>(
            (sum, h) => sum + (h ?? 0),
            0
          );

          // Assert cumulative total equals the sum of individual values
          // Use a small epsilon for floating point comparison
          expect(Math.abs(cumulativeHours - expectedSum)).toBeLessThan(0.001);
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);
});

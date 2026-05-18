/**
 * Property-based test for seed idempotence.
 *
 * Feature: cto-learning-helper, Property 1: Seed Idempotence
 *
 * **Validates: Requirements 1.2**
 *
 * For any number of times the seed command is run (≥ 1) against the same HTML file,
 * the resulting database record counts for Phases, Weeks, Days, and Tags SHALL be
 * identical to those produced by a single run.
 *
 * Since this is a database integration test, we verify idempotence by running the
 * seed twice against a test SQLite database and asserting record counts are identical.
 */

import * as path from 'path';
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { runSeed } from '../prisma/seed';

// Use a separate test database file
const TEST_DB_PATH = path.resolve(__dirname, '..', 'prisma', 'test-idempotence.db');
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

// Path to the HTML source file
const HTML_FILE_PATH = path.resolve(__dirname, '..', '..', 'technical_cto_mastery_final.html');

/**
 * Helper to get all record counts from the database.
 */
async function getRecordCounts(prisma: PrismaClient) {
  const [phases, weeks, days, tags, weekTags] = await Promise.all([
    prisma.phase.count(),
    prisma.week.count(),
    prisma.day.count(),
    prisma.tag.count(),
    prisma.weekTag.count(),
  ]);

  return { phases, weeks, days, tags, weekTags };
}

describe('Property 1: Seed Idempotence', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    // Skip if HTML source file doesn't exist
    if (!fs.existsSync(HTML_FILE_PATH)) {
      return;
    }

    // Remove test DB if it exists from a previous run
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // Push the schema to create the test database (no migrations needed)
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
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();

    // Clean up test database file
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  /**
   * **Validates: Requirements 1.2**
   *
   * Run seed twice against a test database; assert record counts are identical
   * after both runs. This proves upserts are idempotent — re-running the seed
   * never duplicates data.
   */
  it('should produce identical record counts when seed is run twice', async () => {
    // Skip if HTML source file doesn't exist
    if (!fs.existsSync(HTML_FILE_PATH)) {
      console.warn('Skipping seed-idempotence test: HTML source file not found at ' + HTML_FILE_PATH);
      return;
    }

    // First seed run
    await runSeed(prisma, HTML_FILE_PATH);
    const countsAfterFirstRun = await getRecordCounts(prisma);

    // Verify we actually seeded data
    expect(countsAfterFirstRun.phases).toBeGreaterThan(0);
    expect(countsAfterFirstRun.weeks).toBeGreaterThan(0);
    expect(countsAfterFirstRun.days).toBeGreaterThan(0);
    expect(countsAfterFirstRun.tags).toBeGreaterThan(0);
    expect(countsAfterFirstRun.weekTags).toBeGreaterThan(0);

    // Second seed run (should be idempotent)
    await runSeed(prisma, HTML_FILE_PATH);
    const countsAfterSecondRun = await getRecordCounts(prisma);

    // Assert all counts are identical
    expect(countsAfterSecondRun.phases).toBe(countsAfterFirstRun.phases);
    expect(countsAfterSecondRun.weeks).toBe(countsAfterFirstRun.weeks);
    expect(countsAfterSecondRun.days).toBe(countsAfterFirstRun.days);
    expect(countsAfterSecondRun.tags).toBe(countsAfterFirstRun.tags);
    expect(countsAfterSecondRun.weekTags).toBe(countsAfterFirstRun.weekTags);
  }, 300000); // Extended timeout for DB operations (seed runs twice)
});

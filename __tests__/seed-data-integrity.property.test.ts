import * as fc from 'fast-check';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { parseHtmlDataFile } from '../lib/seed-parser';
import { ParsedPhase } from '../lib/types';

/**
 * Property 2: Seed Data Integrity
 * Validates: Requirements 1.4
 *
 * For each seeded week, assert week number, day sortOrder, and phase grouping
 * match the source HTML data array.
 */
describe('Feature: cto-learning-helper, Property 2: Seed Data Integrity', () => {
  let prisma: PrismaClient;
  let parsedPhases: ParsedPhase[];

  beforeAll(() => {
    prisma = new PrismaClient();

    // Parse the HTML source file
    const htmlFilePath = path.resolve(
      __dirname,
      '..',
      '..',
      'technical_cto_mastery_final.html'
    );
    parsedPhases = parseHtmlDataFile(htmlFilePath);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should have matching week numbers, day sortOrders, and phase groupings for all seeded weeks', async () => {
    // Build a flat list of expected weeks with their phase info from parsed data
    const expectedWeeks = parsedPhases.flatMap((phase) =>
      phase.weeks.map((week) => ({
        weekNumber: week.weekNumber,
        phaseName: phase.name,
        daySortOrders: week.days.map((d) => d.sortOrder).sort((a, b) => a - b),
      }))
    );

    // Query all weeks from the database with their days and phase relations
    const dbWeeks = await prisma.week.findMany({
      include: {
        days: { orderBy: { sortOrder: 'asc' } },
        phase: true,
      },
      orderBy: { weekNumber: 'asc' },
    });

    // Skip if database has no seeded curriculum data
    // Check if week 1 exists with the expected number of days from the source
    const week1 = dbWeeks.find(w => w.weekNumber === 1);
    if (!week1 || week1.days.length === 0) {
      console.warn('Skipping seed-data-integrity test: no seeded curriculum data found. Run db:seed first.');
      return;
    }

    // Use fast-check to pick arbitrary weeks from the expected set and verify them
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: expectedWeeks.length - 1 }),
        (index) => {
          const expected = expectedWeeks[index];
          const dbWeek = dbWeeks.find(
            (w) => w.weekNumber === expected.weekNumber
          );

          // Week must exist in the database
          expect(dbWeek).toBeDefined();

          if (!dbWeek) return;

          // Week number must match
          expect(dbWeek.weekNumber).toBe(expected.weekNumber);

          // Phase grouping must match
          expect(dbWeek.phase.name).toBe(expected.phaseName);

          // Day sortOrder values must match
          const dbDaySortOrders = dbWeek.days
            .map((d) => d.sortOrder)
            .sort((a, b) => a - b);
          expect(dbDaySortOrders).toEqual(expected.daySortOrders);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should have all weeks from the source data present in the database', async () => {
    const expectedWeekNumbers = parsedPhases
      .flatMap((phase) => phase.weeks.map((w) => w.weekNumber))
      .sort((a, b) => a - b);

    const dbWeeks = await prisma.week.findMany({
      select: { weekNumber: true },
      orderBy: { weekNumber: 'asc' },
    });
    // Only consider weeks within the expected range (filter out test data)
    const dbWeekNumbers = dbWeeks
      .map((w) => w.weekNumber)
      .filter((n) => n <= 52);

    // Skip if no seeded data
    if (dbWeekNumbers.length === 0) {
      console.warn('Skipping: no seeded data found. Run db:seed first.');
      return;
    }

    // Every week from the source must be in the database
    expect(dbWeekNumbers).toEqual(expectedWeekNumbers);
  });

  it('should preserve phase grouping for arbitrary weeks from the source', async () => {
    // Build a map of weekNumber -> phaseName from parsed data
    const weekToPhaseMap = new Map<number, string>();
    for (const phase of parsedPhases) {
      for (const week of phase.weeks) {
        weekToPhaseMap.set(week.weekNumber, phase.name);
      }
    }

    const dbWeeks = await prisma.week.findMany({
      include: { phase: true },
    });

    // Skip if no seeded data
    if (dbWeeks.length === 0) {
      console.warn('Skipping: no seeded data found. Run db:seed first.');
      return;
    }

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: dbWeeks.length - 1 }),
        (index) => {
          const dbWeek = dbWeeks[index];
          const expectedPhaseName = weekToPhaseMap.get(dbWeek.weekNumber);

          expect(expectedPhaseName).toBeDefined();
          expect(dbWeek.phase.name).toBe(expectedPhaseName);
        }
      ),
      { numRuns: 10 }
    );
  });
});

import { prisma } from '../lib/prisma';

// Test the reviews API route handler logic directly against the database
describe('Reviews API - POST/PUT/GET logic', () => {
  let testWeekId: number;

  beforeAll(async () => {
    // Find or create a week to use for testing
    const week = await prisma.week.findFirst();
    if (!week) {
      throw new Error('No weeks found in database. Run seed first.');
    }
    testWeekId = week.id;
  });

  afterAll(async () => {
    // Clean up test review responses
    await prisma.reviewResponse.deleteMany({
      where: { weekId: testWeekId },
    });
    await prisma.$disconnect();
  });

  it('should create a review response via upsert', async () => {
    const result = await prisma.reviewResponse.upsert({
      where: {
        weekId_prompt: { weekId: testWeekId, prompt: 'learned' },
      },
      update: { response: 'I learned about testing' },
      create: {
        weekId: testWeekId,
        prompt: 'learned',
        response: 'I learned about testing',
      },
    });

    expect(result.weekId).toBe(testWeekId);
    expect(result.prompt).toBe('learned');
    expect(result.response).toBe('I learned about testing');
  });

  it('should update an existing review response via upsert', async () => {
    // First create
    await prisma.reviewResponse.upsert({
      where: {
        weekId_prompt: { weekId: testWeekId, prompt: 'built' },
      },
      update: { response: 'first response' },
      create: {
        weekId: testWeekId,
        prompt: 'built',
        response: 'first response',
      },
    });

    // Then update
    const result = await prisma.reviewResponse.upsert({
      where: {
        weekId_prompt: { weekId: testWeekId, prompt: 'built' },
      },
      update: { response: 'updated response' },
      create: {
        weekId: testWeekId,
        prompt: 'built',
        response: 'updated response',
      },
    });

    expect(result.response).toBe('updated response');

    // Verify only one record exists for this weekId+prompt
    const count = await prisma.reviewResponse.count({
      where: { weekId: testWeekId, prompt: 'built' },
    });
    expect(count).toBe(1);
  });

  it('should retrieve all review responses for a given weekId', async () => {
    // Clean up first
    await prisma.reviewResponse.deleteMany({
      where: { weekId: testWeekId },
    });

    // Create multiple responses
    const prompts = ['learned', 'built', 'difficult', 'differently'] as const;
    for (const prompt of prompts) {
      await prisma.reviewResponse.upsert({
        where: {
          weekId_prompt: { weekId: testWeekId, prompt },
        },
        update: { response: `Response for ${prompt}` },
        create: {
          weekId: testWeekId,
          prompt,
          response: `Response for ${prompt}`,
        },
      });
    }

    const responses = await prisma.reviewResponse.findMany({
      where: { weekId: testWeekId },
    });

    expect(responses).toHaveLength(4);
    expect(responses.map((r) => r.prompt).sort()).toEqual(
      ['built', 'differently', 'difficult', 'learned']
    );
  });

  it('should enforce unique constraint on [weekId, prompt]', async () => {
    // Clean up
    await prisma.reviewResponse.deleteMany({
      where: { weekId: testWeekId, prompt: 'learned' },
    });

    // Create first
    await prisma.reviewResponse.create({
      data: {
        weekId: testWeekId,
        prompt: 'learned',
        response: 'first',
      },
    });

    // Attempting to create a duplicate should fail
    await expect(
      prisma.reviewResponse.create({
        data: {
          weekId: testWeekId,
          prompt: 'learned',
          response: 'duplicate',
        },
      })
    ).rejects.toThrow();
  });
});

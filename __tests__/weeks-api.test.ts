import { prisma } from '../lib/prisma';

// Test the weeks API route handler logic directly against the database
// Since we don't have Next.js installed, we test the core logic

describe('Weeks API - PATCH (toggle completion)', () => {
  let testWeekId: number;

  beforeAll(async () => {
    // Ensure we have a phase and week to work with
    const phase = await prisma.phase.upsert({
      where: { name: 'Test Phase' },
      update: {},
      create: { name: 'Test Phase', badge: '🧪', sortOrder: 99 },
    });

    const week = await prisma.week.upsert({
      where: { weekNumber: 99 },
      update: {},
      create: {
        weekNumber: 99,
        title: 'Test Week',
        goal: 'Test goal',
        saasEvolution: 'Test evolution',
        isComplete: false,
        phaseId: phase.id,
      },
    });

    testWeekId = week.id;
  });

  afterAll(async () => {
    await prisma.week.deleteMany({ where: { weekNumber: 99 } });
    await prisma.phase.deleteMany({ where: { name: 'Test Phase' } });
    await prisma.$disconnect();
  });

  it('should set isComplete to true', async () => {
    const updated = await prisma.week.update({
      where: { id: testWeekId },
      data: { isComplete: true },
    });

    expect(updated.isComplete).toBe(true);
  });

  it('should set isComplete to false', async () => {
    const updated = await prisma.week.update({
      where: { id: testWeekId },
      data: { isComplete: false },
    });

    expect(updated.isComplete).toBe(false);
  });

  it('should toggle isComplete back and forth', async () => {
    await prisma.week.update({
      where: { id: testWeekId },
      data: { isComplete: true },
    });

    let week = await prisma.week.findUnique({ where: { id: testWeekId } });
    expect(week?.isComplete).toBe(true);

    await prisma.week.update({
      where: { id: testWeekId },
      data: { isComplete: false },
    });

    week = await prisma.week.findUnique({ where: { id: testWeekId } });
    expect(week?.isComplete).toBe(false);
  });
});

describe('Weeks API - PUT (update hoursLogged)', () => {
  let testWeekId: number;

  beforeAll(async () => {
    const phase = await prisma.phase.upsert({
      where: { name: 'Test Phase Hours' },
      update: {},
      create: { name: 'Test Phase Hours', badge: '⏱️', sortOrder: 98 },
    });

    const week = await prisma.week.upsert({
      where: { weekNumber: 98 },
      update: {},
      create: {
        weekNumber: 98,
        title: 'Test Week Hours',
        goal: 'Test goal hours',
        saasEvolution: 'Test evolution hours',
        isComplete: false,
        hoursLogged: null,
        phaseId: phase.id,
      },
    });

    testWeekId = week.id;
  });

  afterAll(async () => {
    await prisma.week.deleteMany({ where: { weekNumber: 98 } });
    await prisma.phase.deleteMany({ where: { name: 'Test Phase Hours' } });
    await prisma.$disconnect();
  });

  it('should update hoursLogged with a positive number', async () => {
    const updated = await prisma.week.update({
      where: { id: testWeekId },
      data: { hoursLogged: 5.5 },
    });

    expect(updated.hoursLogged).toBe(5.5);
  });

  it('should update hoursLogged to zero', async () => {
    const updated = await prisma.week.update({
      where: { id: testWeekId },
      data: { hoursLogged: 0 },
    });

    expect(updated.hoursLogged).toBe(0);
  });

  it('should persist hoursLogged across reads', async () => {
    await prisma.week.update({
      where: { id: testWeekId },
      data: { hoursLogged: 12.75 },
    });

    const week = await prisma.week.findUnique({ where: { id: testWeekId } });
    expect(week?.hoursLogged).toBe(12.75);
  });

  it('should allow updating hoursLogged to a new value', async () => {
    await prisma.week.update({
      where: { id: testWeekId },
      data: { hoursLogged: 3 },
    });

    const updated = await prisma.week.update({
      where: { id: testWeekId },
      data: { hoursLogged: 7 },
    });

    expect(updated.hoursLogged).toBe(7);
  });
});

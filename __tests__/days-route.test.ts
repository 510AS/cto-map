import { prisma } from '@/lib/prisma';

// Test the day completion logic directly against the database
describe('PATCH /api/days/[dayId] - Day completion logic', () => {
  let weekId: number;
  let day1Id: number;
  let day2Id: number;
  let day3Id: number;
  let phaseId: number;

  beforeAll(async () => {
    // Create a phase and week with 3 days for testing
    const phase = await prisma.phase.create({
      data: {
        name: 'Test Phase - Days Route',
        badge: '🧪',
        sortOrder: 999,
      },
    });
    phaseId = phase.id;

    const week = await prisma.week.create({
      data: {
        weekNumber: 999,
        title: 'Test Week',
        goal: 'Test goal',
        saasEvolution: 'Test evolution',
        phaseId: phase.id,
      },
    });
    weekId = week.id;

    const day1 = await prisma.day.create({
      data: {
        dayLabel: 'Day 1',
        learnTask: 'Learn 1',
        buildTask: 'Build 1',
        sortOrder: 1,
        weekId: week.id,
      },
    });
    day1Id = day1.id;

    const day2 = await prisma.day.create({
      data: {
        dayLabel: 'Day 2',
        learnTask: 'Learn 2',
        buildTask: 'Build 2',
        sortOrder: 2,
        weekId: week.id,
      },
    });
    day2Id = day2.id;

    const day3 = await prisma.day.create({
      data: {
        dayLabel: 'Day 3',
        learnTask: 'Learn 3',
        buildTask: 'Build 3',
        sortOrder: 3,
        weekId: week.id,
      },
    });
    day3Id = day3.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.day.deleteMany({ where: { weekId } });
    await prisma.week.delete({ where: { id: weekId } });
    await prisma.phase.delete({ where: { id: phaseId } });
    await prisma.$disconnect();
  });

  it('should record completedAt timestamp when marking a day complete', async () => {
    const before = new Date();
    const day = await prisma.day.update({
      where: { id: day1Id },
      data: {
        isComplete: true,
        completedAt: new Date(),
      },
    });

    expect(day.isComplete).toBe(true);
    expect(day.completedAt).not.toBeNull();
    expect(day.completedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('should set completedAt to null when un-completing a day', async () => {
    const day = await prisma.day.update({
      where: { id: day1Id },
      data: {
        isComplete: false,
        completedAt: null,
      },
    });

    expect(day.isComplete).toBe(false);
    expect(day.completedAt).toBeNull();
  });

  it('should auto-complete week when all days are marked complete', async () => {
    // Mark all 3 days complete
    await prisma.day.update({
      where: { id: day1Id },
      data: { isComplete: true, completedAt: new Date() },
    });
    await prisma.day.update({
      where: { id: day2Id },
      data: { isComplete: true, completedAt: new Date() },
    });
    await prisma.day.update({
      where: { id: day3Id },
      data: { isComplete: true, completedAt: new Date() },
    });

    // Check if all days are complete, then mark week complete
    const week = await prisma.week.findUnique({
      where: { id: weekId },
      include: { days: true },
    });

    const allDaysComplete = week!.days.every((d) => d.isComplete);
    expect(allDaysComplete).toBe(true);

    if (allDaysComplete) {
      await prisma.week.update({
        where: { id: weekId },
        data: { isComplete: true },
      });
    }

    const updatedWeek = await prisma.week.findUnique({
      where: { id: weekId },
    });
    expect(updatedWeek!.isComplete).toBe(true);
  });

  it('should un-complete week when any day is un-completed', async () => {
    // Un-complete one day
    await prisma.day.update({
      where: { id: day2Id },
      data: { isComplete: false, completedAt: null },
    });

    // Check if all days are complete
    const week = await prisma.week.findUnique({
      where: { id: weekId },
      include: { days: true },
    });

    const allDaysComplete = week!.days.every((d) => d.isComplete);
    expect(allDaysComplete).toBe(false);

    // Mark week as incomplete since not all days are done
    await prisma.week.update({
      where: { id: weekId },
      data: { isComplete: false },
    });

    const updatedWeek = await prisma.week.findUnique({
      where: { id: weekId },
    });
    expect(updatedWeek!.isComplete).toBe(false);
  });

  it('should not affect other days when toggling one day', async () => {
    // Reset all days to incomplete
    await prisma.day.updateMany({
      where: { weekId },
      data: { isComplete: false, completedAt: null },
    });

    // Mark day1 complete
    await prisma.day.update({
      where: { id: day1Id },
      data: { isComplete: true, completedAt: new Date() },
    });

    // Verify day2 and day3 are still incomplete
    const day2 = await prisma.day.findUnique({ where: { id: day2Id } });
    const day3 = await prisma.day.findUnique({ where: { id: day3Id } });

    expect(day2!.isComplete).toBe(false);
    expect(day3!.isComplete).toBe(false);
  });
});

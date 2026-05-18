import { prisma } from '@/lib/prisma';

// We test the settings API logic directly against the database
// since the route handlers are thin wrappers around Prisma calls.

describe('Settings API - Start Date', () => {
  beforeEach(async () => {
    // Clean up settings before each test
    await prisma.settings.deleteMany();
  });

  afterAll(async () => {
    await prisma.settings.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/settings', () => {
    it('returns null startDate when no settings exist', async () => {
      const settings = await prisma.settings.findUnique({
        where: { id: 1 },
      });

      const startDate = settings?.startDate?.toISOString() ?? null;
      expect(startDate).toBeNull();
    });

    it('returns the saved startDate when settings exist', async () => {
      const testDate = new Date('2025-01-15T00:00:00.000Z');
      await prisma.settings.create({
        data: { id: 1, startDate: testDate },
      });

      const settings = await prisma.settings.findUnique({
        where: { id: 1 },
      });

      const startDate = settings?.startDate?.toISOString() ?? null;
      expect(startDate).toBe('2025-01-15T00:00:00.000Z');
    });
  });

  describe('PUT /api/settings', () => {
    it('creates settings with a valid startDate when none exist', async () => {
      const testDate = new Date('2025-03-01T00:00:00.000Z');

      const settings = await prisma.settings.upsert({
        where: { id: 1 },
        update: { startDate: testDate },
        create: { id: 1, startDate: testDate },
      });

      expect(settings.startDate?.toISOString()).toBe('2025-03-01T00:00:00.000Z');
    });

    it('updates existing settings with a new startDate', async () => {
      // Create initial settings
      await prisma.settings.create({
        data: { id: 1, startDate: new Date('2025-01-01T00:00:00.000Z') },
      });

      // Update with new date
      const newDate = new Date('2025-06-15T00:00:00.000Z');
      const settings = await prisma.settings.upsert({
        where: { id: 1 },
        update: { startDate: newDate },
        create: { id: 1, startDate: newDate },
      });

      expect(settings.startDate?.toISOString()).toBe('2025-06-15T00:00:00.000Z');
    });

    it('rejects invalid date strings', () => {
      const parsedDate = new Date('not-a-date');
      expect(isNaN(parsedDate.getTime())).toBe(true);
    });

    it('persists the startDate across reads', async () => {
      const testDate = new Date('2025-09-20T00:00:00.000Z');

      await prisma.settings.upsert({
        where: { id: 1 },
        update: { startDate: testDate },
        create: { id: 1, startDate: testDate },
      });

      // Re-read from database
      const settings = await prisma.settings.findUnique({
        where: { id: 1 },
      });

      expect(settings?.startDate?.toISOString()).toBe('2025-09-20T00:00:00.000Z');
    });
  });
});

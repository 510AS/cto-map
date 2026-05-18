/**
 * Property-based tests for task item creation and validation API.
 *
 * Feature: day-task-checklist
 * Property 1: Task item creation round-trip
 * Property 2: Invalid input rejection
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 8.1**
 *
 * These tests directly call the route handler functions with mocked Prisma.
 */

// Mock next/server before importing the route
jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string;
      private _body: any;
      constructor(url: string, options?: { method?: string; body?: string }) {
        this.url = url;
        this._body = options?.body ? JSON.parse(options.body) : null;
      }
      async json() {
        return this._body;
      }
    },
    NextResponse: {
      json: (data: any, init?: { status?: number }) => ({
        data,
        status: init?.status || 200,
        async json() {
          return data;
        },
      }),
    },
  };
});

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    day: {
      findUnique: jest.fn(),
    },
    taskItem: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock completion calculator
jest.mock('@/lib/completion-calculator', () => ({
  calculateDayCompletion: jest.fn().mockReturnValue({
    learnComplete: false,
    buildComplete: false,
    isComplete: false,
  }),
}));

import * as fc from 'fast-check';
import { GET, POST } from '@/app/api/task-items/route';
import { prisma } from '@/lib/prisma';

// =============================================================================
// Helpers
// =============================================================================

function createRequest(url: string, options?: { method?: string; body?: any }) {
  return {
    url,
    json: async () => options?.body,
  } as any;
}

// =============================================================================
// Generators
// =============================================================================

/** Generate a valid non-empty, non-whitespace title. */
const validTitleArb = fc.string({ minLength: 1, maxLength: 100 }).filter(
  (s) => s.trim().length > 0
);

/** Generate a valid category. */
const validCategoryArb = fc.constantFrom('learn' as const, 'build' as const);

/** Generate a valid optional time estimate (positive number). */
const validTimeEstimateArb = fc.oneof(
  fc.constant(undefined),
  fc.integer({ min: 1, max: 480 })
);

/** Generate a valid optional note (0 to 500 chars). */
const validNoteArb = fc.oneof(
  fc.constant(undefined),
  fc.string({ minLength: 0, maxLength: 500 })
);

/** Generate a valid dayId (positive integer). */
const validDayIdArb = fc.integer({ min: 1, max: 1000 });

/** Generate a valid CreateTaskItemRequest. */
const validCreateRequestArb = fc.record({
  dayId: validDayIdArb,
  title: validTitleArb,
  category: validCategoryArb,
  timeEstimate: validTimeEstimateArb,
  note: validNoteArb,
});

/** Generate an empty or whitespace-only title. */
const emptyTitleArb = fc.oneof(
  fc.constant(''),
  fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 })
);

/** Generate an invalid category (not "learn" or "build"). */
const invalidCategoryArb = fc.string({ minLength: 1, maxLength: 20 }).filter(
  (s) => s !== 'learn' && s !== 'build'
);

/** Generate a note longer than 500 characters. */
const longNoteArb = fc.string({ minLength: 501, maxLength: 600 });

/** Generate a non-positive time estimate. */
const invalidTimeEstimateArb = fc.oneof(
  fc.constant(0),
  fc.integer({ min: -1000, max: 0 })
);

// =============================================================================
// Property Tests
// =============================================================================

describe('Property 1: Task item creation round-trip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * **Validates: Requirements 1.1, 1.2**
   *
   * For any valid CreateTaskItemRequest, the POST endpoint creates an item
   * and the GET endpoint returns it with matching fields.
   */
  it('POST creates an item with correct fields and GET returns it', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCreateRequestArb,
        fc.integer({ min: 0, max: 50 }), // existing max sortOrder
        async (request, existingMaxSortOrder) => {
          // Setup mocks
          const mockDay = {
            id: request.dayId,
            learnComplete: false,
            buildComplete: false,
            isComplete: false,
          };

          const createdItem = {
            id: Math.floor(Math.random() * 1000) + 1,
            title: request.title.trim(),
            category: request.category,
            isComplete: false,
            sortOrder: existingMaxSortOrder + 1,
            timeEstimate: request.timeEstimate ?? null,
            note: request.note ?? null,
            createdAt: new Date(),
            dayId: request.dayId,
          };

          (prisma.day.findUnique as jest.Mock).mockResolvedValue(mockDay);
          (prisma.taskItem.findFirst as jest.Mock).mockResolvedValue(
            existingMaxSortOrder >= 0 ? { sortOrder: existingMaxSortOrder } : null
          );
          (prisma.taskItem.create as jest.Mock).mockResolvedValue(createdItem);
          (prisma.taskItem.findMany as jest.Mock).mockResolvedValue([createdItem]);

          // Also mock prisma.day.update for the completion update
          (prisma as any).day.update = jest.fn().mockResolvedValue(mockDay);

          // Call POST
          const postReq = createRequest('http://localhost:3000/api/task-items', {
            method: 'POST',
            body: request,
          });
          const postResponse = await POST(postReq);
          const postData = await postResponse.json();

          // Verify POST returns 201
          expect(postResponse.status).toBe(201);

          // Verify created item has correct fields
          expect(postData.title).toBe(request.title.trim());
          expect(postData.category).toBe(request.category);
          expect(postData.isComplete).toBe(false);
          expect(postData.sortOrder).toBe(existingMaxSortOrder + 1);
          expect(postData.timeEstimate).toBe(request.timeEstimate ?? null);
          expect(postData.note).toBe(request.note ?? null);
          expect(postData.dayId).toBe(request.dayId);

          // Now verify GET returns the item
          (prisma.day.findUnique as jest.Mock).mockResolvedValue(mockDay);
          (prisma.taskItem.findMany as jest.Mock).mockResolvedValue([createdItem]);

          const getReq = createRequest(
            `http://localhost:3000/api/task-items?dayId=${request.dayId}`
          );
          const getResponse = await GET(getReq);
          const getData = await getResponse.json();

          // Verify GET returns the item in the correct category group
          const categoryItems = getData[request.category];
          expect(categoryItems).toBeDefined();
          expect(categoryItems.length).toBeGreaterThanOrEqual(1);

          const returnedItem = categoryItems.find(
            (item: any) => item.id === createdItem.id
          );
          expect(returnedItem).toBeDefined();
          expect(returnedItem.title).toBe(request.title.trim());
          expect(returnedItem.category).toBe(request.category);
          expect(returnedItem.isComplete).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 1.2**
   *
   * Sort order is assigned as max existing sortOrder + 1 for the day+category.
   */
  it('assigns sortOrder = max existing sortOrder + 1', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCreateRequestArb,
        fc.integer({ min: 0, max: 100 }),
        async (request, existingMaxSortOrder) => {
          const mockDay = {
            id: request.dayId,
            learnComplete: false,
            buildComplete: false,
            isComplete: false,
          };

          (prisma.day.findUnique as jest.Mock).mockResolvedValue(mockDay);
          (prisma.taskItem.findFirst as jest.Mock).mockResolvedValue({
            sortOrder: existingMaxSortOrder,
          });
          (prisma.taskItem.create as jest.Mock).mockImplementation(async (args: any) => ({
            id: 1,
            ...args.data,
            createdAt: new Date(),
          }));
          (prisma.taskItem.findMany as jest.Mock).mockResolvedValue([]);
          (prisma as any).day.update = jest.fn().mockResolvedValue(mockDay);

          const req = createRequest('http://localhost:3000/api/task-items', {
            method: 'POST',
            body: request,
          });
          const response = await POST(req);

          expect(response.status).toBe(201);

          // Verify prisma.taskItem.create was called with correct sortOrder
          expect(prisma.taskItem.create).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({
                sortOrder: existingMaxSortOrder + 1,
              }),
            })
          );
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 2: Invalid input rejection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * **Validates: Requirements 1.3**
   *
   * For any empty or whitespace-only title, the POST endpoint returns 400.
   */
  it('rejects empty or whitespace-only titles with 400', async () => {
    await fc.assert(
      fc.asyncProperty(
        emptyTitleArb,
        validCategoryArb,
        validDayIdArb,
        async (title, category, dayId) => {
          const req = createRequest('http://localhost:3000/api/task-items', {
            method: 'POST',
            body: { dayId, title, category },
          });
          const response = await POST(req);

          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data.error).toBeDefined();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 1.4**
   *
   * For any invalid category (not "learn" or "build"), the POST endpoint returns 400.
   */
  it('rejects invalid categories with 400', async () => {
    await fc.assert(
      fc.asyncProperty(
        invalidCategoryArb,
        validTitleArb,
        validDayIdArb,
        async (category, title, dayId) => {
          const req = createRequest('http://localhost:3000/api/task-items', {
            method: 'POST',
            body: { dayId, title, category },
          });
          const response = await POST(req);

          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data.error).toBeDefined();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 8.1**
   *
   * For any note longer than 500 characters, the POST endpoint returns 400.
   */
  it('rejects notes longer than 500 characters with 400', async () => {
    await fc.assert(
      fc.asyncProperty(
        longNoteArb,
        validTitleArb,
        validCategoryArb,
        validDayIdArb,
        async (note, title, category, dayId) => {
          const req = createRequest('http://localhost:3000/api/task-items', {
            method: 'POST',
            body: { dayId, title, category, note },
          });
          const response = await POST(req);

          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data.error).toBeDefined();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 1.1 (time estimate validation)**
   *
   * For any non-positive time estimate, the POST endpoint returns 400.
   */
  it('rejects non-positive time estimates with 400', async () => {
    await fc.assert(
      fc.asyncProperty(
        invalidTimeEstimateArb,
        validTitleArb,
        validCategoryArb,
        validDayIdArb,
        async (timeEstimate, title, category, dayId) => {
          const req = createRequest('http://localhost:3000/api/task-items', {
            method: 'POST',
            body: { dayId, title, category, timeEstimate },
          });
          const response = await POST(req);

          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data.error).toBeDefined();
        }
      ),
      { numRuns: 20 }
    );
  });
});

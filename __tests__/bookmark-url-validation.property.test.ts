/**
 * Property-based test for bookmark URL validation.
 *
 * Feature: cto-learning-helper, Property 17: Bookmark URL Validation
 *
 * **Validates: Requirements 9.3**
 *
 * For any string S that does not begin with `http://` or `https://`,
 * attempting to save S as a bookmark URL SHALL return a validation error (HTTP 422)
 * and SHALL NOT persist the bookmark to the database.
 */

import * as fc from 'fast-check';

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
    bookmark: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { POST } from '@/app/api/bookmarks/route';
import { prisma } from '@/lib/prisma';

/**
 * Helper to create a mock request for the bookmarks POST endpoint.
 */
function createPostRequest(body: any) {
  return {
    url: 'http://localhost:3000/api/bookmarks',
    json: async () => body,
  } as any;
}

/**
 * Arbitrary that generates strings which do NOT start with http:// or https://.
 * This covers empty strings, strings with other protocols (ftp://, file://),
 * random text, partial prefixes, and other edge cases.
 */
const invalidUrlArbitrary = fc.string().filter(
  (s) => !s.startsWith('http://') && !s.startsWith('https://')
);

describe('Property 17: Bookmark URL Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * For any string that does not begin with http:// or https://,
   * the POST /api/bookmarks endpoint SHALL return HTTP 422 and
   * SHALL NOT create a database record.
   */
  it('should reject any URL not starting with http:// or https:// with HTTP 422 and no DB write', async () => {
    await fc.assert(
      fc.asyncProperty(invalidUrlArbitrary, async (invalidUrl) => {
        // Clear mocks between iterations
        (prisma.bookmark.create as jest.Mock).mockClear();

        const req = createPostRequest({ url: invalidUrl, label: 'Test' });
        const response = await POST(req);

        // Assert HTTP 422 status
        expect(response.status).toBe(422);

        // Assert error message
        const data = await response.json() as { error: string };
        expect(data.error).toBe('URL must begin with http:// or https://');

        // Assert no database record was created
        expect(prisma.bookmark.create).not.toHaveBeenCalled();
      }),
      { numRuns: 10 }
    );
  });
});

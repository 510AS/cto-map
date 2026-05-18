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

import { GET, POST, DELETE } from '@/app/api/bookmarks/route';
import { prisma } from '@/lib/prisma';

function createRequest(url: string, options?: { method?: string; body?: any }) {
  return {
    url,
    json: async () => options?.body,
  } as any;
}

describe('GET /api/bookmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all bookmarks when no filters provided', async () => {
    const mockBookmarks = [
      { id: 1, url: 'https://example.com', label: 'Example', weekId: 1, tagId: null, createdAt: new Date() },
    ];
    (prisma.bookmark.findMany as jest.Mock).mockResolvedValue(mockBookmarks);

    const req = createRequest('http://localhost:3000/api/bookmarks');
    const response = await GET(req);
    const data = await response.json();

    expect(data).toEqual(mockBookmarks);
    expect(prisma.bookmark.findMany).toHaveBeenCalledWith({
      where: {},
      include: {
        week: { select: { weekNumber: true, title: true } },
        tag: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('filters by weekId when provided', async () => {
    (prisma.bookmark.findMany as jest.Mock).mockResolvedValue([]);

    const req = createRequest('http://localhost:3000/api/bookmarks?weekId=5');
    const response = await GET(req);

    expect(prisma.bookmark.findMany).toHaveBeenCalledWith({
      where: { weekId: 5 },
      include: {
        week: { select: { weekNumber: true, title: true } },
        tag: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('filters by tagId when provided', async () => {
    (prisma.bookmark.findMany as jest.Mock).mockResolvedValue([]);

    const req = createRequest('http://localhost:3000/api/bookmarks?tagId=3');
    const response = await GET(req);

    expect(prisma.bookmark.findMany).toHaveBeenCalledWith({
      where: { tagId: 3 },
      include: {
        week: { select: { weekNumber: true, title: true } },
        tag: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('filters by both weekId and tagId when provided', async () => {
    (prisma.bookmark.findMany as jest.Mock).mockResolvedValue([]);

    const req = createRequest('http://localhost:3000/api/bookmarks?weekId=2&tagId=4');
    const response = await GET(req);

    expect(prisma.bookmark.findMany).toHaveBeenCalledWith({
      where: { weekId: 2, tagId: 4 },
      include: {
        week: { select: { weekNumber: true, title: true } },
        tag: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  });
});

describe('POST /api/bookmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a bookmark with a valid https URL', async () => {
    const mockBookmark = { id: 1, url: 'https://example.com', label: 'Test', weekId: 1, tagId: null, createdAt: new Date() };
    (prisma.bookmark.create as jest.Mock).mockResolvedValue(mockBookmark);

    const req = createRequest('http://localhost:3000/api/bookmarks', {
      method: 'POST',
      body: { url: 'https://example.com', label: 'Test', weekId: 1 },
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual(mockBookmark);
    expect(prisma.bookmark.create).toHaveBeenCalledWith({
      data: { url: 'https://example.com', label: 'Test', weekId: 1, tagId: null },
    });
  });

  it('creates a bookmark with a valid http URL', async () => {
    const mockBookmark = { id: 2, url: 'http://example.com', label: null, weekId: null, tagId: 2, createdAt: new Date() };
    (prisma.bookmark.create as jest.Mock).mockResolvedValue(mockBookmark);

    const req = createRequest('http://localhost:3000/api/bookmarks', {
      method: 'POST',
      body: { url: 'http://example.com', tagId: 2 },
    });
    const response = await POST(req);

    expect(response.status).toBe(201);
    expect(prisma.bookmark.create).toHaveBeenCalled();
  });

  it('rejects a URL not starting with http:// or https:// with 422', async () => {
    const req = createRequest('http://localhost:3000/api/bookmarks', {
      method: 'POST',
      body: { url: 'ftp://example.com', label: 'Bad' },
    });
    const response = await POST(req);
    const data = await response.json() as { error: string };

    expect(response.status).toBe(422);
    expect(data.error).toBe('URL must begin with http:// or https://');
    expect(prisma.bookmark.create).not.toHaveBeenCalled();
  });

  it('rejects an empty URL with 422', async () => {
    const req = createRequest('http://localhost:3000/api/bookmarks', {
      method: 'POST',
      body: { url: '' },
    });
    const response = await POST(req);

    expect(response.status).toBe(422);
    expect(prisma.bookmark.create).not.toHaveBeenCalled();
  });

  it('rejects a missing URL with 422', async () => {
    const req = createRequest('http://localhost:3000/api/bookmarks', {
      method: 'POST',
      body: { label: 'No URL' },
    });
    const response = await POST(req);

    expect(response.status).toBe(422);
    expect(prisma.bookmark.create).not.toHaveBeenCalled();
  });

  it('rejects a URL with javascript: protocol with 422', async () => {
    const req = createRequest('http://localhost:3000/api/bookmarks', {
      method: 'POST',
      body: { url: 'javascript:alert(1)' },
    });
    const response = await POST(req);

    expect(response.status).toBe(422);
    expect(prisma.bookmark.create).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/bookmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes a bookmark by id', async () => {
    (prisma.bookmark.delete as jest.Mock).mockResolvedValue({ id: 1 });

    const req = createRequest('http://localhost:3000/api/bookmarks', {
      method: 'DELETE',
      body: { id: 1 },
    });
    const response = await DELETE(req);
    const data = await response.json();

    expect(data).toEqual({ success: true });
    expect(prisma.bookmark.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('returns 400 when id is missing', async () => {
    const req = createRequest('http://localhost:3000/api/bookmarks', {
      method: 'DELETE',
      body: {},
    });
    const response = await DELETE(req);
    const data = await response.json() as { error: string };

    expect(response.status).toBe(400);
    expect(data.error).toBe('Bookmark id is required');
    expect(prisma.bookmark.delete).not.toHaveBeenCalled();
  });
});

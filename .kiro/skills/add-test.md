# Skill: Add Test

## When to Use
When you need to add tests for new or existing functionality.

## Steps

1. Create file at `__tests__/[name].test.ts` (unit) or `__tests__/[name].property.test.ts` (property-based)
2. Import the function/module to test
3. Mock Prisma if testing API routes
4. Write test cases

## Unit Test Template

```typescript
import { myFunction } from '../lib/my-module';

describe('myFunction', () => {
  it('should handle normal case', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });

  it('should handle edge case', () => {
    const result = myFunction(null);
    expect(result).toBe(defaultValue);
  });
});
```

## Property-Based Test Template

```typescript
import * as fc from 'fast-check';
import { myFunction } from '../lib/my-module';

describe('Property: myFunction invariants', () => {
  it('should always return positive number', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (a, b) => {
          const result = myFunction(a, b);
          expect(result).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## API Route Test Template

```typescript
jest.mock('@/lib/prisma', () => ({
  prisma: {
    day: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    taskItem: {
      findMany: jest.fn(),
    },
  },
}));

import { PATCH } from '@/app/api/days/[dayId]/route';
import { prisma } from '@/lib/prisma';

describe('PATCH /api/days/[dayId]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 for invalid input', async () => {
    const req = new Request('http://localhost/api/days/1', {
      method: 'PATCH',
      body: JSON.stringify({ invalid: true }),
    });
    const res = await PATCH(req, { params: { dayId: '1' } });
    expect(res.status).toBe(400);
  });
});
```

## Running Tests
```bash
npm test                          # All tests
npx jest __tests__/file.test.ts   # Specific file
npx jest --watch                  # Watch mode
npx jest --coverage               # With coverage report
```

## Jest Config Notes
- Path alias `@/` maps to project root (configured in `jest.config.js`)
- Test environment is `node` (not jsdom)
- Only files matching `**/*.test.ts` are picked up

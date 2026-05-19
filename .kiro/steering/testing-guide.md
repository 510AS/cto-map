---
inclusion: fileMatch
fileMatchPattern: "__tests__/**"
---

# Testing Guide

## Setup
- **Runner**: Jest with ts-jest preset
- **Environment**: Node (not jsdom — API route tests)
- **Property Testing**: fast-check library
- **Config**: `jest.config.js` with `@/` path alias mapping

## Running Tests
```bash
npm test                    # Run all tests
npx jest --watch            # Watch mode
npx jest __tests__/file.ts  # Run specific file
```

## Test Organization
- `__tests__/*.test.ts` — Unit tests for API routes and lib functions
- `__tests__/*.property.test.ts` — Property-based tests with fast-check
- `__tests__/components/*.test.tsx` — Component tests (limited, no jsdom)

## Patterns

### API Route Tests
```typescript
// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    day: { findUnique: jest.fn(), update: jest.fn() },
    week: { findUnique: jest.fn() },
  },
}));

// Test the handler
import { PATCH } from '@/app/api/days/[dayId]/route';
const req = new Request('http://localhost/api/days/1', {
  method: 'PATCH',
  body: JSON.stringify({ isComplete: true }),
});
const res = await PATCH(req, { params: { dayId: '1' } });
expect(res.status).toBe(200);
```

### Property-Based Tests
```typescript
import * as fc from 'fast-check';

it('should always return value in [1, 52]', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 946684800000, max: 4102444800000 }),
      fc.integer({ min: 946684800000, max: 4102444800000 }),
      (startTs, currentTs) => {
        const result = getCurrentWeekNumber(new Date(startTs), new Date(currentTs));
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(52);
      }
    ),
    { numRuns: 10 }
  );
});
```

## What to Test
- Pure functions in `lib/` (calculations, parsers, validators)
- API route handlers (validation, DB interactions, response format)
- Completion cascade logic (TaskItem → Day → Week)
- Edge cases: empty arrays, null values, boundary numbers

## What NOT to Test (in this project)
- React component rendering (no jsdom setup)
- CSS/styling
- Third-party library internals

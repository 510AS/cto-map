# Skill: Add API Route

## When to Use
When you need to create a new API endpoint for the CTO Map project.

## Steps

1. Create file at `app/api/[endpoint-name]/route.ts`
2. Import dependencies:
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { prisma } from '@/lib/prisma';
   ```
3. Export handler functions (GET, POST, PATCH, PUT, DELETE)
4. Validate inputs (use Zod from `lib/validators.ts` or manual checks)
5. Wrap everything in try/catch
6. Return `NextResponse.json(data)` or `NextResponse.json({ error }, { status })`

## Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const param = searchParams.get('param');

    if (!param) {
      return NextResponse.json({ error: 'param is required' }, { status: 400 });
    }

    const data = await prisma.model.findMany({ where: { ... } });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Validate body...
    
    const created = await prisma.model.create({ data: { ... } });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Rules
- Always handle errors with try/catch
- Return appropriate HTTP status codes (200, 201, 400, 404, 500)
- If modifying Day completion, run `calculateDayCompletion()` from `lib/completion-calculator.ts`
- If modifying Day, check if Week should auto-complete

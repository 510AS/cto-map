# Skill: Fix Bug

## When to Use
When debugging issues in the CTO Map project.

## Common Bug Categories

### 1. Infinite API Calls / Infinite Loop
**Symptom**: Server log shows the same endpoint being called hundreds of times per second.
**Cause**: A `useCallback` or `useEffect` has a dependency that changes every render (usually an inline function prop).
**Fix**: Use `useRef` for callback props:
```typescript
const callbackRef = useRef(onSomething);
callbackRef.current = onSomething;
// Use callbackRef.current in useCallback/useEffect, NOT onSomething in deps
```

### 2. Dark Mode Text Invisible
**Symptom**: Text disappears in dark mode.
**Cause**: Missing `dark:` variant on text color.
**Fix**: Add `dark:text-gray-100` (or appropriate shade) to every `text-gray-900` etc.

### 3. "X is not a function" on API Response
**Symptom**: `items.filter is not a function` or similar.
**Cause**: API returns an object `{ learn: [], build: [] }` but code expects a flat array.
**Fix**: Destructure correctly: `const { learn, build } = await res.json()`

### 4. Days Show as Empty / 0 Days
**Symptom**: Week page shows "No days found" or "0/0 days".
**Cause**: Database was reset by a migration. Days table is empty.
**Fix**: Re-run `npm run db:seed`

### 5. Server Component Using Client Features
**Symptom**: "Event handlers cannot be passed to Client Component props" error.
**Cause**: A server component has `onClick`, `useState`, or other client-only code.
**Fix**: Add `'use client';` at the top, or extract the interactive part into a separate client component.

### 6. Prisma EPERM Error on Windows
**Symptom**: `EPERM: operation not permitted, rename '...query_engine-windows.dll.node'`
**Cause**: Dev server has the Prisma DLL locked.
**Fix**: Stop the dev server → run prisma command → restart dev server.

### 7. Progress Not Updating
**Symptom**: Sidebar/dashboard shows stale progress after completing tasks.
**Cause**: `refreshProgress()` not called, or ProgressContext cache not invalidated.
**Fix**: Call `refreshProgress()` after the API call succeeds. Or use `forceRefresh()` to bypass the 30-second cache.

## Debugging Steps

1. **Check the dev server terminal** for compilation errors
2. **Check browser console** for runtime errors
3. **Test the API directly**: `curl http://localhost:3000/api/endpoint`
4. **Check the database**: Write a temp script with Prisma queries
5. **Add console.log** in the API route to see what data is being processed

## Quick Database Check Script
```javascript
// Save as tmp-check.js, run with: node tmp-check.js
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const count = await p.day.count();
  console.log('Total days:', count);
  // Add more queries as needed
  await p.$disconnect();
}
main();
```

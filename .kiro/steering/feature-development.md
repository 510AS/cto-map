---
inclusion: manual
---

# Feature Development Guide

## Adding a New Feature — Step by Step

### 1. Schema Changes (if needed)
- Edit `prisma/schema.prisma`
- Run `npx prisma db push` (for dev) or `npx prisma migrate dev --name feature_name`
- Update `lib/types.ts` with new TypeScript interfaces

### 2. API Route
- Create `app/api/[endpoint]/route.ts`
- Export named functions: `GET`, `POST`, `PATCH`, `PUT`, `DELETE`
- Validate inputs with Zod or manual checks
- Always return `NextResponse.json()`
- Always wrap in try/catch

### 3. Component
- Create `components/[Name].tsx`
- Add `'use client';` if it has state/effects/event handlers
- Add dark mode classes to ALL elements
- Ensure 44px minimum touch targets
- Use existing contexts (toast, progress, theme)

### 4. Page
- Create `app/[route]/page.tsx`
- Client component if interactive, server component if data-display only
- Add to Navigation.tsx if it's a main page

### 5. Tests (optional but recommended)
- Create `__tests__/[name].test.ts`
- Test the API route handler and/or pure logic functions

## Common Gotchas

### 1. Infinite Loops
If a child component calls a parent callback that triggers re-render → new callback ref → child re-fetches → calls callback again → infinite loop.
**Fix**: Use `useRef` for callbacks in dependency arrays.

### 2. Server vs Client Components
- Server components can't use hooks, event handlers, or browser APIs
- Client components can't use `prisma` directly (it's server-only)
- If you need both: fetch data in a server component, pass as props to a client component

### 3. API Response Format
The `/api/task-items` endpoint returns `{ learn: [...], build: [...] }` (an object), NOT a flat array. Always destructure correctly.

### 4. Week ID vs Week Number
- `GET /api/weeks/[weekId]` treats the param as `weekNumber` (1-52)
- `PATCH /api/weeks/[weekId]` treats the param as the database `id`
- This is a known inconsistency — be careful when calling these endpoints

### 5. Prisma Client Lock
When the dev server is running, `npx prisma generate` may fail with EPERM on Windows. Stop the server first.

### 6. React 19 + Next 14 Peer Deps
Always use `npm install --legacy-peer-deps` when adding packages.

## Adding to Navigation
Edit `app/Navigation.tsx`:
- Add to `navItems` array for main nav (max 5-6 items)
- Or add to the "More" section for secondary pages
- Mobile bottom nav shows only the main items

## Completion Flow Diagram
```
User checks TaskItem
  → PATCH /api/task-items/[id] { isComplete: true }
  → Server: update TaskItem
  → Server: calculateDayCompletion() for all items in that day
  → Server: update Day { learnComplete, buildComplete, isComplete }
  → Server: check if all Days in Week are complete
  → Server: if yes, update Week { isComplete: true }
  → Response: { ...taskItem, dayCompletion }
  → Client: onCompletionChange callback updates parent
  → Client: refreshProgress() updates sidebar
```

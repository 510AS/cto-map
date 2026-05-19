# AI Agent Instructions — CTO Map

This file provides context for any AI coding assistant working on this project.

## Project Summary
A 52-week Technical CTO Mastery curriculum tracker. Users complete daily Learn/Build tasks, track progress, write reviews, and build a SaaS product alongside the curriculum.

## Tech Stack
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 14 (App Router) | Framework |
| TypeScript | 6.x (strict) | Language |
| Prisma | 5.22 | ORM |
| SQLite | - | Database |
| Tailwind CSS | 3.4 | Styling |
| Zod | 3.x | Validation |
| dnd-kit | - | Drag and drop |
| Jest | 29 | Testing |
| fast-check | 3.x | Property testing |

## Architecture Overview

```
app/                          # Next.js App Router
├── api/                      # 30+ REST API endpoints
├── page.tsx                  # Dashboard (Server Component)
├── today/page.tsx            # Morning briefing
├── progress/page.tsx         # All weeks overview
├── analytics/page.tsx        # Charts and insights
├── week/[weekNumber]/        # Week detail
│   ├── page.tsx
│   ├── day/[daySort]/page.tsx  # Day detail
│   └── plan/page.tsx         # Weekly planning
└── ...

components/                   # 35+ React components
lib/                         # Utilities, contexts, types
prisma/                      # Schema, migrations, seed
__tests__/                   # 40+ test files
```

## Data Model (simplified)
```
Phase (3) → Week (52) → Day (312) → TaskItem (N)
```

Completion cascades upward: TaskItems → Day → Week

## Critical Rules for AI Agents

### 1. Dark Mode is Mandatory
Every UI element must have dark mode variants. Common pairs:
- `text-gray-900 dark:text-gray-100`
- `bg-white dark:bg-gray-900`
- `border-gray-200 dark:border-gray-700`

### 2. Touch Targets
All buttons, links, checkboxes: `min-h-[44px] min-w-[44px]`

### 3. Client vs Server Components
- `'use client';` → hooks, state, events, browser APIs
- No directive → server component (can use Prisma directly)
- Never import Prisma in a client component

### 4. State Management
```typescript
import { useToast } from '@/lib/toast-context';    // Notifications
import { useProgress } from '@/lib/progress-context'; // Global progress
import { useTheme } from '@/lib/theme-context';    // Theme switching
```

### 5. API Response Format
`/api/task-items?dayId=X` returns `{ learn: TaskItem[], build: TaskItem[] }` — NOT a flat array.

### 6. Completion Logic
After modifying TaskItem completion:
1. Fetch all TaskItems for that day
2. Call `calculateDayCompletion(items, existingState)`
3. Update Day with result
4. Check if all Days in Week are complete → auto-complete Week

### 7. Avoiding Infinite Loops
When passing callbacks to child components that trigger re-renders:
```typescript
const callbackRef = useRef(onCallback);
callbackRef.current = onCallback;
// Use callbackRef.current in effects, NOT onCallback in deps
```

### 8. Package Installation
Always use: `npm install --legacy-peer-deps` (React 19 + Next 14 conflict)

## Commands
```bash
npm install --legacy-peer-deps  # Install deps
npx prisma db push              # Sync schema to DB
npx prisma migrate dev          # Create migration
npm run db:seed                 # Seed curriculum data
npx next dev                    # Dev server (port 3000)
npm test                        # Run tests
```

## File Naming
- Pages: `app/[route]/page.tsx`
- API routes: `app/api/[endpoint]/route.ts`
- Components: `components/PascalCase.tsx`
- Utilities: `lib/camelCase.ts`
- Tests: `__tests__/kebab-case.test.ts`

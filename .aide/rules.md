# CTO Map — Aide Rules

## Project Context
52-week Technical CTO Mastery curriculum tracker built with Next.js 14 (App Router), TypeScript, Prisma ORM (SQLite), Tailwind CSS with dark mode.

## Architecture
- Server Components for data pages, Client Components for interactive pages
- React Context for state: ProgressProvider, ToastProvider, ThemeProvider
- Completion cascade: TaskItems → Day → Week (automatic)
- 3 Phases → 52 Weeks → 312 Days → N TaskItems per day

## Coding Rules
1. Dark mode required: every text/bg/border class needs a dark: variant
2. Touch targets: min-h-[44px] min-w-[44px] on all interactive elements
3. Use 'use client'; for components with hooks/state/events
4. Types go in lib/types.ts, validators in lib/validators.ts
5. API routes at app/api/[name]/route.ts, export GET/POST/PATCH/PUT/DELETE
6. Use useRef for callback props to prevent infinite re-render loops
7. /api/task-items returns { learn: [], build: [] } object, not flat array
8. After completion changes: call refreshProgress() to update sidebar
9. npm install --legacy-peer-deps (peer dep conflict)
10. Use .card, .stat-card, .badge-blue CSS classes from globals.css

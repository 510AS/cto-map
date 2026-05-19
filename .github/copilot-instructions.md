# GitHub Copilot Instructions for CTO Map

## Project Context
This is a 52-week Technical CTO Mastery curriculum tracker built with Next.js 14 (App Router), Prisma/SQLite, Tailwind CSS, and TypeScript.

## Code Style
- Functional React components only
- TypeScript strict mode
- Tailwind CSS for all styling (no CSS modules, no styled-components)
- Dark mode support required on ALL components (use `dark:` prefix)
- Minimum 44x44px touch targets on interactive elements
- Use existing utility classes: `.card`, `.stat-card`, `.badge-blue`, `.badge-green`

## Architecture
- Server Components for data-heavy pages (dashboard)
- Client Components for interactive pages (add `'use client';`)
- API routes at `app/api/[endpoint]/route.ts`
- Shared types in `lib/types.ts`
- State management via React Context (ProgressProvider, ToastProvider, ThemeProvider)

## Key Patterns
- After any task completion change: call `calculateDayCompletion()` then check week auto-complete
- Use `useRef` for callback props passed to child components (prevents infinite loops)
- API `/api/task-items` returns `{ learn: TaskItem[], build: TaskItem[] }` — always destructure
- Use `showToast("message", "success"|"error"|"info")` for user feedback
- Use `refreshProgress()` after completion state changes

## Don't
- Don't use Pages Router patterns (getServerSideProps, etc.)
- Don't use `any` type — use proper interfaces from `lib/types.ts`
- Don't forget dark mode classes
- Don't use external UI libraries (no MUI, no Chakra) — Tailwind only
- Don't put `onCallback` functions in useCallback/useEffect dependency arrays (use useRef)

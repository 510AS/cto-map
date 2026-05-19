---
inclusion: auto
---

# CTO Map — Project Overview

## What This Project Is
A 52-week Technical CTO Mastery curriculum tracker built with Next.js 14 (App Router), Prisma ORM with SQLite, Tailwind CSS, and TypeScript. It tracks daily learning progress through 3 phases: Senior Backend Engineer → Staff/Principal Engineer → Technical CTO.

## Tech Stack
- **Framework**: Next.js 14 with App Router (NOT Pages Router)
- **Language**: TypeScript (strict mode)
- **Database**: SQLite via Prisma ORM (schema at `prisma/schema.prisma`)
- **Styling**: Tailwind CSS with dark mode (`darkMode: "class"`)
- **Validation**: Zod (schemas in `lib/validators.ts`)
- **Drag & Drop**: @dnd-kit/core + @dnd-kit/sortable
- **Testing**: Jest + ts-jest + fast-check (property-based testing)
- **Package Manager**: npm (use `--legacy-peer-deps` for installs due to React 19 + Next 14 peer dep conflict)

## Key Architecture Decisions
1. **Server Components for data-heavy pages** (dashboard) + **Client Components for interactive pages** (week detail, day detail, progress)
2. **Shared state via React Context** — `ProgressProvider`, `ToastProvider`, `ThemeProvider` wrap the app in `app/Providers.tsx`
3. **Day-based progress** — overall completion is calculated from completed days (312 total), not weeks
4. **Two-level task system** — Days have Learn/Build tasks (from curriculum) + user-created TaskItems (sub-tasks)
5. **Auto-completion cascade** — TaskItems complete → Day completes → Week completes (all automatic)
6. **Dark mode everywhere** — every component must have `dark:` Tailwind variants

## Database Models (key relationships)
- Phase → has many Weeks (3 phases, 52 weeks total)
- Week → has many Days (6 days per week, 312 total)
- Day → has many TaskItems (user-created sub-tasks)
- Week → has one BuildLogEntry, many ReviewResponses, many Bookmarks
- Week ↔ Tag (many-to-many via WeekTag)

## Running the Project
```bash
npm install --legacy-peer-deps
npx prisma migrate dev
npm run db:seed  # Seeds from HTML curriculum file
npx next dev     # Starts on localhost:3000
npm test         # Runs Jest tests
```

# Design Document — CTO Learning Helper

## Overview

The CTO Learning Helper is a single-user, locally-hosted Next.js 14 (App Router) web application. It tracks progress through a 52-week Technical CTO Mastery curriculum, seeded from an existing HTML file. The app runs on a laptop bound to `0.0.0.0` and is accessible from mobile devices over home WiFi. All data is persisted in SQLite via Prisma. No authentication is required.

---

## Architecture

### High-Level Architecture

```
Browser (desktop / mobile)
        │  HTTP
        ▼
Next.js 14 App Router (Node.js, 0.0.0.0:3000)
  ├── app/                  ← React Server Components + Client Components
  ├── app/api/              ← Route Handlers (REST-style JSON API)
  └── lib/                  ← Business logic, Prisma client, utilities
        │
        ▼
  Prisma ORM
        │
        ▼
  SQLite (dev.db)
```

### Key Architectural Decisions

- **App Router with Server Components** — data-fetching pages are Server Components; interactive widgets (mark complete, notes, filters) are Client Components with `"use client"`.
- **Route Handlers for mutations** — all writes go through `app/api/` route handlers so the client never imports Prisma directly.
- **Single SQLite file** — simple, zero-config, survives laptop restarts. Prisma migrations manage schema evolution.
- **Seed script** — a standalone `prisma/seed.ts` script parses the HTML file and upserts all curriculum data. Safe to re-run.
- **0.0.0.0 binding** — `next.config.ts` sets `hostname: '0.0.0.0'` and the `package.json` dev/start scripts pass `--hostname 0.0.0.0`.

---

## Directory Structure

```
cto-learning-helper/
├── app/
│   ├── layout.tsx                  ← Root layout, nav, global styles
│   ├── page.tsx                    ← Dashboard (Current Week)
│   ├── progress/
│   │   └── page.tsx                ← Progress overview (all 52 weeks)
│   ├── week/
│   │   └── [weekNumber]/
│   │       └── page.tsx            ← Week detail (days, notes, review, build log)
│   ├── timeline/
│   │   └── page.tsx                ← SaaS Evolution Timeline
│   ├── bookmarks/
│   │   └── page.tsx                ← Resource Bookmarks
│   ├── build-log/
│   │   └── page.tsx                ← Build Log
│   ├── settings/
│   │   └── page.tsx                ← Start Date + settings
│   └── api/
│       ├── settings/route.ts       ← GET/PUT start date, hours
│       ├── days/[dayId]/route.ts   ← PATCH complete/incomplete
│       ├── weeks/[weekId]/route.ts ← PATCH complete, PUT hours
│       ├── notes/route.ts          ← POST/PUT week & day notes
│       ├── build-log/route.ts      ← POST/PUT build log entries
│       ├── bookmarks/route.ts      ← GET/POST/DELETE bookmarks
│       └── reviews/route.ts        ← POST/PUT weekly review responses
├── components/
│   ├── WeekCard.tsx
│   ├── DayRow.tsx
│   ├── TagFilter.tsx
│   ├── StreakBadge.tsx
│   ├── ProgressBar.tsx
│   ├── NoteEditor.tsx
│   ├── BuildLogEntry.tsx
│   ├── BookmarkForm.tsx
│   ├── ReviewPrompts.tsx
│   └── TimelineEntry.tsx
├── lib/
│   ├── prisma.ts                   ← Singleton Prisma client
│   ├── seed-parser.ts              ← HTML → structured data parser
│   ├── calculations.ts             ← Pure functions: streak, week#, percentages
│   └── types.ts                    ← Shared TypeScript types
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── dev.db                      ← SQLite file (gitignored)
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Data Models

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Settings {
  id        Int      @id @default(1)
  startDate DateTime?
  updatedAt DateTime @updatedAt
}

model Phase {
  id        Int    @id @default(autoincrement())
  name      String @unique
  badge     String
  sortOrder Int
  weeks     Week[]
}

model Week {
  id             Int      @id @default(autoincrement())
  weekNumber     Int      @unique
  title          String
  goal           String
  saasEvolution  String
  isComplete     Boolean  @default(false)
  hoursLogged    Float?
  note           String?
  phaseId        Int
  phase          Phase    @relation(fields: [phaseId], references: [id])
  days           Day[]
  tags           WeekTag[]
  buildLogEntry  BuildLogEntry?
  reviewResponses ReviewResponse[]
  bookmarks      Bookmark[]
}

model Day {
  id          Int       @id @default(autoincrement())
  dayLabel    String
  learnTask   String
  buildTask   String
  sortOrder   Int
  isComplete  Boolean   @default(false)
  completedAt DateTime?
  note        String?
  weekId      Int
  week        Week      @relation(fields: [weekId], references: [id])
}

model Tag {
  id    Int       @id @default(autoincrement())
  name  String    @unique
  weeks WeekTag[]
  bookmarks Bookmark[]
}

model WeekTag {
  weekId Int
  tagId  Int
  week   Week @relation(fields: [weekId], references: [id])
  tag    Tag  @relation(fields: [tagId], references: [id])

  @@id([weekId, tagId])
}

model BuildLogEntry {
  id        Int      @id @default(autoincrement())
  content   String
  weekId    Int      @unique
  week      Week     @relation(fields: [weekId], references: [id])
  updatedAt DateTime @updatedAt
}

model Bookmark {
  id        Int      @id @default(autoincrement())
  url       String
  label     String?
  weekId    Int?
  tagId     Int?
  week      Week?    @relation(fields: [weekId], references: [id])
  tag       Tag?     @relation(fields: [tagId], references: [id])
  createdAt DateTime @default(now())
}

model ReviewResponse {
  id        Int      @id @default(autoincrement())
  weekId    Int
  prompt    String   // "learned" | "built" | "difficult" | "differently"
  response  String
  week      Week     @relation(fields: [weekId], references: [id])
  updatedAt DateTime @updatedAt

  @@unique([weekId, prompt])
}
```

---

## Components and Interfaces

### Pure Calculation Functions (`lib/calculations.ts`)

```typescript
/**
 * Returns the current week number (1–52) given a start date and today's date.
 * Clamps to 52 if elapsed time exceeds 52 weeks.
 */
export function getCurrentWeekNumber(startDate: Date, today: Date): number {
  const elapsedDays = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.min(Math.floor(elapsedDays / 7) + 1, 52);
}

/**
 * Returns the current streak: consecutive calendar days ending on today
 * where at least one day was marked complete.
 */
export function calculateStreak(completionDates: Date[], today: Date): number

/**
 * Returns the longest streak ever achieved from a set of completion dates.
 */
export function calculateLongestStreak(completionDates: Date[]): number

/**
 * Returns the count of distinct calendar days with at least one completion.
 */
export function countStudyDays(completionDates: Date[]): number

/**
 * Returns overall curriculum completion percentage (0–100).
 */
export function overallCompletionPct(completedWeeks: number): number {
  return (completedWeeks / 52) * 100;
}

/**
 * Returns per-phase completion percentage (0–100).
 */
export function phaseCompletionPct(completedInPhase: number, totalInPhase: number): number {
  if (totalInPhase === 0) return 0;
  return (completedInPhase / totalInPhase) * 100;
}

/**
 * Returns per-week completion percentage (0–100).
 */
export function weekCompletionPct(completedDays: number, totalDays: number): number {
  if (totalDays === 0) return 0;
  return (completedDays / totalDays) * 100;
}
```

### Seed Parser (`lib/seed-parser.ts`)

```typescript
export interface ParsedDay {
  dayLabel: string;
  learnTask: string;
  buildTask: string;
  sortOrder: number;
}

export interface ParsedWeek {
  weekNumber: number;
  title: string;
  tags: string[];
  days: ParsedDay[];
  goal: string;
  saasEvolution: string;
}

export interface ParsedPhase {
  name: string;
  badge: string;
  sortOrder: number;
  weeks: ParsedWeek[];
}

/**
 * Reads the HTML file at `filePath`, extracts the `const data=[...]` JS array
 * using a regex, evaluates it in a sandboxed context, and returns structured data.
 * Throws a descriptive error if the file is not found or the array cannot be parsed.
 */
export function parseHtmlDataFile(filePath: string): ParsedPhase[]
```

The parser uses a regex to extract the `data=[...]` array literal from the `<script>` block, then uses `vm.runInNewContext` (Node.js built-in) to safely evaluate the array expression without executing the rest of the script.

### API Route Handlers

All route handlers follow this pattern:

```typescript
// app/api/days/[dayId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { dayId: string } }
) {
  const { isComplete } = await req.json();
  const day = await prisma.day.update({
    where: { id: Number(params.dayId) },
    data: {
      isComplete,
      completedAt: isComplete ? new Date() : null,
    },
  });
  // Auto-complete week if all days done
  const week = await prisma.week.findUnique({
    where: { id: day.weekId },
    include: { days: true },
  });
  if (week && week.days.every((d) => d.isComplete)) {
    await prisma.week.update({
      where: { id: week.id },
      data: { isComplete: true },
    });
  }
  return NextResponse.json(day);
}
```

### Navigation Structure

```
/ (Dashboard)
├── /progress
├── /week/[weekNumber]
│   ├── Days tab
│   ├── Notes tab
│   ├── Review tab
│   └── Build Log tab
├── /timeline
├── /bookmarks
├── /build-log
└── /settings
```

The root layout renders a persistent bottom navigation bar on mobile (≤768px) and a left sidebar on desktop (≥768px).

---

## Responsive Layout

### Breakpoints

| Breakpoint | Width     | Layout                          |
|------------|-----------|---------------------------------|
| Mobile     | 375–767px | Bottom nav, single-column cards |
| Tablet     | 768–1023px| Side nav collapsed, 2-col grid  |
| Desktop    | 1024–1440px| Side nav expanded, 3-col grid  |

### Touch Targets

All interactive elements (buttons, checkboxes, links) use `min-h-[44px] min-w-[44px]` Tailwind classes to meet the 44×44 CSS pixel minimum.

### Server Binding

`package.json`:
```json
{
  "scripts": {
    "dev": "next dev --hostname 0.0.0.0",
    "start": "next start --hostname 0.0.0.0"
  }
}
```

---

## Seeding Flow

```
npm run db:seed
        │
        ▼
prisma/seed.ts
  1. Resolve HTML file path (env var or default ../technical_cto_mastery_final.html)
  2. Call parseHtmlDataFile(path)
     ├── File not found → print error, process.exit(1)
     └── Parse success → ParsedPhase[]
  3. For each Phase: prisma.phase.upsert({ where: { name }, ... })
  4. For each Week: prisma.week.upsert({ where: { weekNumber }, ... })
  5. For each Day: prisma.day.upsert({ where: { weekId_sortOrder }, ... })
  6. For each Tag: prisma.tag.upsert({ where: { name }, ... })
  7. For each WeekTag: prisma.weekTag.upsert({ where: { weekId_tagId }, ... })
  8. Print "Seeded N weeks across M phases." and exit 0
```

Upserts ensure idempotency — re-running the seed never duplicates data.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| HTML file not found at seed time | Print `Error: HTML file not found at <path>. Please check the configured path.` and `process.exit(1)` |
| HTML data array cannot be parsed | Print `Error: Could not parse data array from HTML file. Ensure the file is unmodified.` and `process.exit(1)` |
| Prisma query error in API route | Return `{ error: "Internal server error" }` with HTTP 500 |
| Invalid bookmark URL (no http/https) | Return `{ error: "URL must begin with http:// or https://" }` with HTTP 422 |
| Week number out of range (1–52) | Return `{ error: "Week number must be between 1 and 52" }` with HTTP 400 |
| Start date in the future | Treat as Week 1, Day 1 (elapsed days = 0) |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Seed Idempotence

*For any* number of times the seed command is run (≥ 1) against the same HTML file, the resulting database record counts for Phases, Weeks, Days, and Tags SHALL be identical to those produced by a single run.

**Validates: Requirements 1.2**

---

### Property 2: Seed Data Integrity

*For any* week W in the seeded database, W's week number, day order (by `sortOrder`), and phase grouping SHALL exactly match the corresponding entry in the source HTML `data` array.

**Validates: Requirements 1.4**

---

### Property 3: Current Week Calculation

*For any* start date S and current date C where C ≥ S, `getCurrentWeekNumber(S, C)` SHALL equal `min(floor((C − S).days / 7) + 1, 52)`, and the result SHALL always be in the range [1, 52].

**Validates: Requirements 2.4, 2.5**

---

### Property 4: Start Date Round-Trip

*For any* valid date D saved as the Start Date via the settings API, a subsequent GET to the settings API SHALL return D, and all Current Week calculations SHALL use D as the reference point.

**Validates: Requirements 2.2**

---

### Property 5: Completion Percentage Correctness

*For any* set of K completed weeks out of 52 total, `overallCompletionPct(K)` SHALL equal `(K / 52) * 100`. *For any* phase P with K completed weeks out of N total weeks in P, `phaseCompletionPct(K, N)` SHALL equal `(K / N) * 100`. *For any* week W with K completed days out of N total days, `weekCompletionPct(K, N)` SHALL equal `(K / N) * 100`.

**Validates: Requirements 3.3, 5.2, 5.3, 4.4**

---

### Property 6: Day Completion Independence

*For any* two distinct days D1 and D2 within the same week, toggling the completion state of D1 SHALL NOT change the completion state of D2.

**Validates: Requirements 4.3**

---

### Property 7: Auto-Complete Week on All Days Done

*For any* week W with N days, when all N days are marked complete, W.isComplete SHALL be set to `true` automatically. Conversely, if any day in W is marked incomplete, W.isComplete SHALL be `false`.

**Validates: Requirements 4.5**

---

### Property 8: Completion Persistence

*For any* set of day and week completion states written to the database, re-reading those records from the database SHALL return the same completion states.

**Validates: Requirements 5.5**

---

### Property 9: Streak Calculation

*For any* set of completion timestamps T, `calculateStreak(T, today)` SHALL equal the length of the longest consecutive sequence of calendar days ending on `today` such that each day in the sequence has at least one timestamp in T. If today has no completion, the streak SHALL be 0.

**Validates: Requirements 6.1, 6.2**

---

### Property 10: Longest Streak Invariant

*For any* completion history H, `calculateLongestStreak(H)` SHALL be greater than or equal to `calculateStreak(H, today)`.

**Validates: Requirements 6.3**

---

### Property 11: Total Study Days Count

*For any* set of completion timestamps T, `countStudyDays(T)` SHALL equal the count of distinct calendar days (by local date) that appear in T.

**Validates: Requirements 6.4**

---

### Property 12: Cumulative Hours Sum

*For any* set of weekly hour values `{h₁, h₂, …, hₙ}` stored in the database, the dashboard's displayed total hours SHALL equal `Σhᵢ`.

**Validates: Requirements 6.6**

---

### Property 13: Note Round-Trip

*For any* non-empty note text T saved to a week W or day D, subsequently loading W or D from the database SHALL return T as the note value.

**Validates: Requirements 7.3**

---

### Property 14: Note Indicator Presence

*For any* week W or day D with a non-empty saved note, the rendered card for W or D SHALL include a visual note indicator. *For any* week W or day D with no saved note (or an empty string), the rendered card SHALL NOT include the note indicator.

**Validates: Requirements 7.4**

---

### Property 15: Build Log Update Replaces Previous Entry

*For any* week W, if build log entry E1 is saved and then entry E2 is saved for the same week W, querying W's build log SHALL return E2 and not E1.

**Validates: Requirements 8.4**

---

### Property 16: Build Log Order

*For any* set of saved build log entries, the Build Log screen SHALL display them in strictly ascending order of week number.

**Validates: Requirements 8.3**

---

### Property 17: Bookmark URL Validation

*For any* string S that does not begin with `http://` or `https://`, attempting to save S as a bookmark URL SHALL return a validation error and SHALL NOT persist the bookmark to the database.

**Validates: Requirements 9.3**

---

### Property 18: Weekly Review Round-Trip

*For any* response text R saved for prompt P of week W, subsequently loading week W's review SHALL return R for prompt P.

**Validates: Requirements 10.3**

---

### Property 19: Review Indicator Presence

*For any* week W that has at least one non-empty saved review response, the week card SHALL display a visual review indicator. *For any* week W with no saved review responses, the card SHALL NOT display the review indicator.

**Validates: Requirements 10.4**

---

### Property 20: Timeline Completion Visual State

*For any* week W, the SaaS Evolution Timeline SHALL render W with completed styling if and only if `W.isComplete = true`.

**Validates: Requirements 11.2**

---

### Property 21: Tag Filter Correctness

*For any* non-empty selection of tags T and any week W displayed after filtering, W SHALL have at least one tag that is a member of T. *For any* empty tag selection, all 52 weeks SHALL be displayed.

**Validates: Requirements 12.2, 12.3, 12.4**

---

### Property 22: Responsive No Horizontal Scroll

*For any* viewport width W in the range [375, 1440] CSS pixels, no page in the application SHALL produce a horizontal scrollbar (i.e., `document.documentElement.scrollWidth <= W`).

**Validates: Requirements 13.2**

---

### Property 23: Touch Target Minimum Size

*For any* interactive element E rendered in the application (buttons, checkboxes, links, toggles), E's rendered bounding box SHALL have both width ≥ 44 CSS pixels and height ≥ 44 CSS pixels.

**Validates: Requirements 13.3**


---

## Testing Strategy

### Dual Testing Approach

Both unit/example-based tests and property-based tests are used. They are complementary: example tests cover specific scenarios and integration points; property tests cover universal invariants across all valid inputs.

### Unit / Example Tests

Focus on:
- Specific UI rendering scenarios (settings screen exists, dashboard prompt when no start date, etc.)
- Integration points between the seed parser and Prisma upserts
- Error conditions (missing HTML file, invalid bookmark URL, out-of-range week number)
- Navigation behavior (timeline click → week detail, mobile landing page)
- CRUD operations (add bookmark, delete bookmark, mark week complete from overview)

### Property-Based Tests

Use a TypeScript property-based testing library (e.g., `fast-check`) for the pure functions in `lib/calculations.ts` and the API layer logic.

**Configuration:** Minimum 100 iterations per property test.

**Tag format:** `Feature: cto-learning-helper, Property {N}: {property_text}`

Key property test targets:
- `getCurrentWeekNumber` — arbitrary date pairs, verify formula and clamping (Property 3)
- `calculateStreak` / `calculateLongestStreak` / `countStudyDays` — arbitrary completion timestamp sets (Properties 9, 10, 11)
- `overallCompletionPct` / `phaseCompletionPct` / `weekCompletionPct` — arbitrary integer inputs (Property 5)
- Seed idempotence — run seed twice, compare DB state (Property 1)
- Note round-trip — arbitrary strings saved and re-read (Property 13)
- Build log update — arbitrary entry pairs, verify last-write-wins (Property 15)
- Bookmark URL validation — arbitrary strings, verify rejection of non-http(s) (Property 17)
- Tag filter — arbitrary tag selections against seeded data (Property 21)

### Integration Tests

- Seed command with real HTML file: verify 52 weeks, all phases, all days, all tags present (Requirement 1.1)
- Seed command with missing file: verify non-zero exit and error message (Requirement 1.3)
- Full request/response cycle for each API route handler using a test SQLite database

### Smoke Tests

- Server binds to `0.0.0.0` (Requirement 13.1) — verified by checking `next.config.ts` and `package.json` scripts

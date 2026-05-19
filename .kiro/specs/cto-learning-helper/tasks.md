# Implementation Plan: CTO Map

## Overview

Build a single-user, locally-hosted Next.js 14 (App Router) web application that tracks progress through a 52-week Technical CTO Mastery curriculum. Data is seeded from an existing HTML file and persisted in SQLite via Prisma. The app is accessible from mobile devices over home WiFi.

## Tasks

- [x] 1. Project bootstrap and configuration
  - Initialise a new Next.js 14 project with TypeScript and Tailwind CSS in `cto-learning-helper/`
  - Add Prisma, `@prisma/client`, and `fast-check` as dependencies; pin exact versions
  - Configure `next.config.ts` with `hostname: '0.0.0.0'`
  - Set `package.json` scripts: `"dev": "next dev --hostname 0.0.0.0"`, `"start": "next start --hostname 0.0.0.0"`, `"db:seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"`
  - Create `.env` with `DATABASE_URL="file:./dev.db"`
  - Add `prisma/dev.db` to `.gitignore`
  - _Requirements: 13.1_

- [x] 2. Prisma schema and database setup
  - [x] 2.1 Write `prisma/schema.prisma` with all models: `Settings`, `Phase`, `Week`, `Day`, `Tag`, `WeekTag`, `BuildLogEntry`, `Bookmark`, `ReviewResponse`
    - Include all fields, relations, and constraints exactly as specified in the design
    - _Requirements: 1.1, 2.2, 4.2, 6.5, 7.1, 7.2, 8.2, 9.1, 9.5, 10.3_
  - [x] 2.2 Run `prisma migrate dev --name init` to generate the initial migration and SQLite database
    - _Requirements: 1.1_

- [x] 3. Shared types and pure calculation functions
  - [x] 3.1 Create `lib/types.ts` with all shared TypeScript interfaces used across the app
    - _Requirements: 1.4, 2.4, 3.3, 4.4, 5.2, 5.3, 6.1_
  - [x] 3.2 Create `lib/prisma.ts` as a singleton Prisma client (safe for Next.js hot-reload)
    - _Requirements: 1.1_
  - [x] 3.3 Implement `lib/calculations.ts` with all pure functions: `getCurrentWeekNumber`, `calculateStreak`, `calculateLongestStreak`, `countStudyDays`, `overallCompletionPct`, `phaseCompletionPct`, `weekCompletionPct`
    - _Requirements: 2.4, 2.5, 3.3, 3.4, 4.4, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4_
  - [x] 3.4 Write property test for `getCurrentWeekNumber` (Property 3)
    - **Property 3: Current Week Calculation**
    - **Validates: Requirements 2.4, 2.5**
    - Use `fast-check` with arbitrary date pairs where C ≥ S; assert formula and [1, 52] clamping
  - [x] 3.5 Write property tests for streak and study-day functions (Properties 9, 10, 11)
    - **Property 9: Streak Calculation** — arbitrary timestamp sets, verify consecutive-day logic and zero-streak when today has no completion
    - **Property 10: Longest Streak Invariant** — assert `calculateLongestStreak(H) >= calculateStreak(H, today)` for all H
    - **Property 11: Total Study Days Count** — assert `countStudyDays(T)` equals distinct calendar-day count in T
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  - [x] 3.6 Write property tests for completion percentage functions (Property 5)
    - **Property 5: Completion Percentage Correctness**
    - **Validates: Requirements 3.3, 5.2, 5.3, 4.4**
    - Use `fast-check` with arbitrary integer inputs; assert exact formula for all three functions

- [x] 4. HTML seed parser
  - [x] 4.1 Implement `lib/seed-parser.ts` with `parseHtmlDataFile(filePath): ParsedPhase[]`
    - Use regex to extract the `data=[...]` array literal from the `<script>` block
    - Evaluate with `vm.runInNewContext` (Node.js built-in)
    - Throw descriptive errors for missing file and unparseable array
    - _Requirements: 1.1, 1.3, 1.4_
  - [x] 4.2 Implement `prisma/seed.ts` seeding script
    - Resolve HTML file path from env var or default `../technical_cto_mastery_final.html`
    - Call `parseHtmlDataFile`, then upsert Phases, Weeks, Days, Tags, WeekTags in order
    - Print success message and exit 0; print error and exit 1 on failure
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 4.3 Write property test for seed idempotence (Property 1)
    - **Property 1: Seed Idempotence**
    - **Validates: Requirements 1.2**
    - Run seed twice against a test database; assert record counts are identical after both runs
  - [x] 4.4 Write property test for seed data integrity (Property 2)
    - **Property 2: Seed Data Integrity**
    - **Validates: Requirements 1.4**
    - For each seeded week, assert week number, day `sortOrder`, and phase grouping match the source HTML `data` array

- [x] 5. API route handlers
  - [x] 5.1 Implement `app/api/settings/route.ts` — GET and PUT for start date
    - _Requirements: 2.1, 2.2_
  - [x] 5.2 Write property test for start date round-trip (Property 4)
    - **Property 4: Start Date Round-Trip**
    - **Validates: Requirements 2.2**
    - Use `fast-check` with arbitrary valid dates; PUT then GET and assert returned date equals saved date
  - [x] 5.3 Implement `app/api/days/[dayId]/route.ts` — PATCH complete/incomplete with auto-complete week logic
    - Record `completedAt` timestamp on completion; set to null on un-completion
    - Auto-complete week when all days are done; un-complete week when any day is un-completed
    - _Requirements: 4.2, 4.3, 4.5_
  - [x] 5.4 Write property test for day completion independence (Property 6)
    - **Property 6: Day Completion Independence**
    - **Validates: Requirements 4.3**
    - For arbitrary pairs of distinct days in the same week, assert toggling D1 does not change D2's state
  - [x] 5.5 Write property test for auto-complete week on all days done (Property 7)
    - **Property 7: Auto-Complete Week on All Days Done**
    - **Validates: Requirements 4.5**
    - Assert week becomes complete when all N days are marked complete; assert week is incomplete when any day is un-completed
  - [x] 5.6 Implement `app/api/weeks/[weekId]/route.ts` — PATCH complete, PUT hours
    - _Requirements: 5.4, 6.5_
  - [x] 5.7 Write property test for completion persistence (Property 8)
    - **Property 8: Completion Persistence**
    - **Validates: Requirements 5.5**
    - Write arbitrary completion states to the database; re-read and assert they match
  - [x] 5.8 Implement `app/api/notes/route.ts` — POST/PUT week and day notes
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 5.9 Write property test for note round-trip (Property 13)
    - **Property 13: Note Round-Trip**
    - **Validates: Requirements 7.3**
    - Use `fast-check` with arbitrary non-empty strings; save and re-read, assert equality
  - [x] 5.10 Implement `app/api/build-log/route.ts` — POST/PUT build log entries
    - _Requirements: 8.2, 8.4_
  - [x] 5.11 Write property test for build log last-write-wins (Property 15)
    - **Property 15: Build Log Update Replaces Previous Entry**
    - **Validates: Requirements 8.4**
    - Save E1 then E2 for the same week; assert only E2 is returned
  - [x] 5.12 Implement `app/api/bookmarks/route.ts` — GET, POST, DELETE bookmarks with URL validation
    - Reject URLs not beginning with `http://` or `https://` with HTTP 422
    - _Requirements: 9.1, 9.3, 9.4, 9.5_
  - [x] 5.13 Write property test for bookmark URL validation (Property 17)
    - **Property 17: Bookmark URL Validation**
    - **Validates: Requirements 9.3**
    - Use `fast-check` with arbitrary strings that do not start with `http://` or `https://`; assert HTTP 422 and no DB record created
  - [x] 5.14 Implement `app/api/reviews/route.ts` — POST/PUT weekly review responses
    - _Requirements: 10.2, 10.3_
  - [x] 5.15 Write property test for weekly review round-trip (Property 18)
    - **Property 18: Weekly Review Round-Trip**
    - **Validates: Requirements 10.3**
    - Use `fast-check` with arbitrary response text; save and re-read for each prompt, assert equality

- [x] 6. Checkpoint — API layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Root layout, navigation, and global styles
  - [x] 7.1 Create `app/layout.tsx` with root layout, global Tailwind styles, and responsive navigation
    - Render a persistent bottom nav bar on mobile (≤768px) and a left sidebar on desktop (≥768px)
    - All interactive nav elements must use `min-h-[44px] min-w-[44px]`
    - _Requirements: 13.2, 13.3, 13.4_
  - [x] 7.2 Create shared UI components: `ProgressBar.tsx`, `StreakBadge.tsx`, `TagFilter.tsx`
    - `TagFilter` renders all unique tags and supports multi-select; emits selected tag set to parent
    - _Requirements: 3.3, 3.4, 12.1, 12.2, 12.5_

- [x] 8. Dashboard page
  - [x] 8.1 Create `app/page.tsx` as a Server Component that fetches current week data and renders the dashboard
    - Show prompt to configure Start Date when none is set (Requirement 2.3)
    - Display current week title, phase, goal, SaaS Evolution note, current day's Learn/Build tasks
    - Display overall and phase completion percentages, streak count, total study days, cumulative hours
    - _Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.3, 6.4, 6.6, 13.4_
  - [x] 8.2 Write property test for cumulative hours sum (Property 12)
    - **Property 12: Cumulative Hours Sum**
    - **Validates: Requirements 6.6**
    - Use `fast-check` with arbitrary sets of weekly hour values; assert dashboard total equals their sum

- [x] 9. Settings page
  - [x] 9.1 Create `app/settings/page.tsx` as a Client Component with a date input that calls the settings API
    - _Requirements: 2.1, 2.2_

- [x] 10. Progress overview page
  - [x] 10.1 Create `app/progress/page.tsx` listing all 52 weeks grouped by phase with completion status and percentage
    - Integrate `TagFilter` for tag-based filtering
    - Support marking a week complete from this view without page reload
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 12.1, 12.2, 12.3, 12.4, 12.5_
  - [x] 10.2 Create `WeekCard.tsx` component used by the progress overview
    - Show visual note indicator when week has a saved note (Requirement 7.4)
    - Show visual review indicator when week has at least one saved review response (Requirement 10.4)
    - _Requirements: 5.1, 7.4, 10.4_
  - [x] 10.3 Write property test for note indicator presence (Property 14)
    - **Property 14: Note Indicator Presence**
    - **Validates: Requirements 7.4**
    - Assert indicator present when note is non-empty; assert indicator absent when note is empty or null
  - [x] 10.4 Write property test for review indicator presence (Property 19)
    - **Property 19: Review Indicator Presence**
    - **Validates: Requirements 10.4**
    - Assert indicator present when at least one review response exists; absent when none exist
  - [x] 10.5 Write property test for tag filter correctness (Property 21)
    - **Property 21: Tag Filter Correctness**
    - **Validates: Requirements 12.2, 12.3, 12.4**
    - For arbitrary non-empty tag selections, assert every displayed week has at least one matching tag; for empty selection, assert all 52 weeks shown

- [x] 11. Week detail page
  - [x] 11.1 Create `app/week/[weekNumber]/page.tsx` with four tabs: Days, Notes, Review, Build Log
    - _Requirements: 4.1, 7.1, 8.1, 10.1_
  - [x] 11.2 Create `DayRow.tsx` — renders day label, Learn Task, Build Task, completion checkbox, and day note input
    - Checkbox must be `min-h-[44px] min-w-[44px]`; calls `PATCH /api/days/[dayId]` on toggle
    - Show per-week completion percentage (Requirement 4.4)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.2, 13.3_
  - [x] 11.3 Create `NoteEditor.tsx` — textarea that auto-saves on blur; calls notes API
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 11.4 Create `ReviewPrompts.tsx` — renders the four fixed prompts with text areas; calls reviews API
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 11.5 Create `BuildLogEntry.tsx` — textarea for build log; calls build-log API
    - _Requirements: 8.1, 8.2, 8.4_

- [x] 12. SaaS Evolution Timeline page
  - [x] 12.1 Create `app/timeline/page.tsx` listing all 52 weeks in chronological order grouped by phase
    - Integrate `TagFilter` for filtering
    - Visually distinguish completed vs incomplete weeks
    - Clicking a week navigates to `/week/[weekNumber]`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 12.3_
  - [x] 12.2 Create `TimelineEntry.tsx` component
    - _Requirements: 11.1, 11.2_
  - [x] 12.3 Write property test for timeline completion visual state (Property 20)
    - **Property 20: Timeline Completion Visual State**
    - **Validates: Requirements 11.2**
    - Assert completed styling applied if and only if `week.isComplete = true`

- [x] 13. Bookmarks page
  - [x] 13.1 Create `app/bookmarks/page.tsx` displaying all bookmarks grouped by week or tag
    - _Requirements: 9.1, 9.2, 9.4_
  - [x] 13.2 Create `BookmarkForm.tsx` — form with URL and label inputs; calls bookmarks API; shows validation error for non-http(s) URLs
    - _Requirements: 9.1, 9.3_

- [x] 14. Build Log page
  - [x] 14.1 Create `app/build-log/page.tsx` listing all weeks in order with their build log text areas
    - _Requirements: 8.1, 8.3_
  - [x] 14.2 Write property test for build log order (Property 16)
    - **Property 16: Build Log Order**
    - **Validates: Requirements 8.3**
    - Assert build log entries are rendered in strictly ascending week-number order for any set of saved entries

- [x] 15. Responsive layout and touch target verification
  - [x] 15.1 Write property test for no horizontal scroll (Property 22)
    - **Property 22: Responsive No Horizontal Scroll**
    - **Validates: Requirements 13.2**
    - For viewport widths in [375, 1440], assert `document.documentElement.scrollWidth <= viewportWidth` on each page
  - [x] 15.2 Write property test for touch target minimum size (Property 23)
    - **Property 23: Touch Target Minimum Size**
    - **Validates: Requirements 13.3**
    - Assert every interactive element's bounding box has width ≥ 44px and height ≥ 44px

- [x] 16. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with a minimum of 100 iterations per property
- Checkpoints ensure incremental validation at the API layer and after full UI integration
- The seed script is safe to re-run; upserts guarantee idempotency
- `prisma/dev.db` is gitignored; run `npm run db:seed` after cloning to populate data

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1"] },
    { "id": 1, "tasks": ["2.2", "3.2", "3.3", "4.1"] },
    { "id": 2, "tasks": ["3.4", "3.5", "3.6", "4.2"] },
    { "id": 3, "tasks": ["4.3", "4.4", "5.1", "5.3", "5.6", "5.8", "5.10", "5.12", "5.14"] },
    { "id": 4, "tasks": ["5.2", "5.4", "5.5", "5.7", "5.9", "5.11", "5.13", "5.15", "7.1", "7.2"] },
    { "id": 5, "tasks": ["8.1", "9.1", "10.1", "10.2", "11.1", "12.1", "12.2", "13.1", "13.2", "14.1"] },
    { "id": 6, "tasks": ["8.2", "10.3", "10.4", "10.5", "11.2", "11.3", "11.4", "11.5", "12.3", "14.2"] },
    { "id": 7, "tasks": ["15.1", "15.2"] }
  ]
}
```

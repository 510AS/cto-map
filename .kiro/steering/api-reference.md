---
inclusion: auto
---

# API Reference

## Core Endpoints

### Settings
- `GET /api/settings` → `{ startDate: string | null }`
- `PUT /api/settings` ← `{ startDate: string }` (ISO date)

### Days
- `GET /api/days/by-week?weekNumber=X&sortOrder=Y` → Day with week info
- `GET /api/days/[dayId]/full` → Day + taskItems + suggestions (single call)
- `PATCH /api/days/[dayId]` ← `{ learnComplete?, buildComplete?, isComplete?, skipped?, confidence?, reflection? }`
- `POST /api/days/swap` ← `{ dayId1, dayId2 }` (swap sortOrder)

### Weeks
- `GET /api/weeks` → All 52 weeks with phases, days, tags
- `GET /api/weeks/[weekId]?include=full` → Week with days (incl. taskItems), reviews, buildLog, phase
- `PATCH /api/weeks/[weekId]` ← `{ isComplete: boolean }` (uses DB id, not weekNumber)
- `PUT /api/weeks/[weekId]` ← `{ hoursLogged: number }`

### Task Items
- `GET /api/task-items?dayId=X` → `{ learn: TaskItem[], build: TaskItem[] }`
- `POST /api/task-items` ← `{ dayId, title, category, timeEstimate?, note?, priority?, resourceUrl? }`
- `PATCH /api/task-items/[id]` ← `{ isComplete?, title?, timeEstimate?, note?, priority?, actualMinutes?, resourceUrl? }`
- `DELETE /api/task-items/[id]`
- `PATCH /api/task-items/reorder` ← `{ dayId, category, orderedIds: number[] }`
- `POST /api/task-items/bulk-complete` ← `{ dayId, category }`
- `GET /api/task-items/suggestions?dayId=X` → `TaskItemSuggestion[]`
- `GET /api/task-items/stats` → ChecklistStatsResponse

### Notes & Reviews
- `POST /api/notes` ← `{ weekId? | dayId?, content }`
- `GET /api/reviews?weekId=X` → ReviewResponse[]
- `POST /api/reviews` ← `{ weekId, prompt, response }` (upserts)

### Build Log
- `GET /api/build-log` → All weeks with buildLogEntry
- `POST /api/build-log` ← `{ weekId, content }` (upserts)

### Bookmarks
- `GET /api/bookmarks?weekId=X&tagId=Y` → Bookmark[]
- `POST /api/bookmarks` ← `{ url, label?, weekId?, tagId? }`
- `DELETE /api/bookmarks` ← `{ id }`

### Progress & Analytics
- `GET /api/progress-summary` → `{ completedWeekIds, completedDayIds, totalDays }`
- `GET /api/today` → `{ weekNumber, daySort }`
- `GET /api/analytics` → weeklyCompletions, last30Days, tagStats, hoursStats
- `GET /api/heatmap` → All 312 days with status
- `GET /api/xp` → `{ totalXP, level, nextLevelXP }`
- `GET /api/burnout-check` → `{ risk, score, suggestions, factors }`

### Gamification
- `GET /api/achievements` → unlocked Achievement[]
- `POST /api/achievements` → checks and unlocks new badges
- `GET /api/challenges` → current WeeklyChallenge[]
- `GET /api/review-reminders` → due ReviewReminder[]
- `PATCH /api/review-reminders/[id]` ← `{ confidence }` (reschedules)

### Search & Export
- `GET /api/search?q=term` → grouped results
- `GET /api/export` → downloadable Markdown file
- `GET /api/sync/export` → full JSON data export
- `POST /api/sync/import` ← JSON data to merge

### Other
- `GET /api/timeline` → phases with weeks and tags
- `GET /api/knowledge` → tags with weeks and completion status
- `GET /api/flashcards` → weeks with review responses
- `GET /api/weekly-digest` → current week summary stats

## Important Notes
- `PATCH /api/days/[dayId]` auto-checks if all days in week are complete → auto-completes week
- `PATCH /api/task-items/[id]` runs `calculateDayCompletion()` → may auto-complete the day
- `POST /api/task-items` also runs completion calculator (adding an incomplete item may un-complete a day)
- The suggestions endpoint filters out items that already exist as TaskItems for that day

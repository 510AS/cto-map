---
inclusion: fileMatch
fileMatchPattern: "prisma/**"
---

# Database Schema Guide

#[[file:prisma/schema.prisma]]

## Key Relationships

```
Phase (3)
  └── Week (52 total, ~12-24 per phase)
        ├── Day (6 per week, 312 total)
        │     └── TaskItem (user-created, 0-N per day)
        ├── BuildLogEntry (0-1 per week)
        ├── ReviewResponse (0-4 per week: learned, built, difficult, differently)
        ├── Bookmark (0-N per week)
        ├── WeekTag → Tag (many-to-many)
        └── ReviewReminder (0-N, for spaced repetition)

Settings (singleton, id=1)
Achievement (unlocked badges)
WeeklyChallenge (auto-generated goals)
```

## Completion Cascade Logic

1. **TaskItem toggled** → `calculateDayCompletion()` runs:
   - If ALL learn TaskItems complete → `day.learnComplete = true`
   - If ALL build TaskItems complete → `day.buildComplete = true`
   - If both → `day.isComplete = true`, `day.completedAt = now()`

2. **Day completed** → check week:
   - If ALL 6 days in week are complete → `week.isComplete = true`

3. **Day has no TaskItems** → fallback to manual Learn/Build checkboxes

## Important Constraints
- `Day` has `@@unique([weekId, sortOrder])` — one day per position per week
- `TaskItem` has `@@index([dayId, category, sortOrder])` — fast queries
- `ReviewResponse` has `@@unique([weekId, prompt])` — one response per prompt per week
- `BuildLogEntry` has `weekId @unique` — one entry per week
- `Week` has `weekNumber @unique` — 1 through 52

## Migration Commands
```bash
# After schema changes:
npx prisma db push          # Quick sync (no migration file, may lose data)
npx prisma migrate dev      # Create migration file (safe, preserves data)
npx prisma generate         # Regenerate client (auto-runs after migrate)

# Seed data:
npm run db:seed             # Parses HTML curriculum file into DB
```

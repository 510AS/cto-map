# Requirements Document

## Introduction

The CTO Map is a personal, locally-hosted Next.js web application that helps a single user track progress through a 52-week Technical CTO Mastery curriculum. The app is seeded from an existing HTML file (`technical_cto_mastery_final.html`) that contains all 52 weeks of structured learning data. It runs on a laptop and is accessible from a mobile device over home WiFi.

The app provides a current-week dashboard, daily task views, progress tracking, streak monitoring, notes, a build log, resource bookmarks, weekly review prompts, a SaaS evolution timeline, and tag-based filtering — all backed by SQLite via Prisma.

---

## Glossary

- **App**: The CTO Map Next.js application.
- **Curriculum**: The full 52-week Technical CTO Mastery learning plan.
- **Phase**: A named group of weeks within the Curriculum (e.g., "Level 1 — Senior Backend Engineer").
- **Week**: One of the 52 curriculum weeks, each containing a title, tags, days, a goal, and a SaaS evolution note.
- **Day**: A single study day within a Week, containing a learn task and a build task.
- **Learn Task**: The reading/study activity for a given Day.
- **Build Task**: The hands-on coding/shipping activity for a given Day.
- **Start Date**: The user-entered date on which Week 1, Day 1 of the Curriculum begins.
- **Current Week**: The Week that corresponds to the current calendar date relative to the Start Date.
- **Current Day**: The Day within the Current Week that corresponds to today's calendar date.
- **Streak**: The count of consecutive calendar days on which the user marked at least one Day complete.
- **Build Log Entry**: A free-text record of shipped work associated with a specific Week.
- **Bookmark**: A URL and optional label saved by the user and associated with a specific Week or tag.
- **Weekly Review**: A structured set of reflection prompts associated with a specific Week.
- **SaaS Evolution Timeline**: A visual chronological map showing the SaaS Evolution note for each Week.
- **Tag**: A topic label (e.g., PHP, Laravel, DB, DevOps) attached to one or more Weeks.
- **Seed**: The one-time process of parsing `technical_cto_mastery_final.html` and populating the SQLite database with all Curriculum data.
- **Prisma**: The ORM used to interact with the SQLite database.

---

## Requirements

### Requirement 1 — Data Seeding

**User Story:** As a user, I want the app to automatically populate itself from the existing HTML file so that I do not have to manually enter 52 weeks of curriculum data.

#### Acceptance Criteria

1. THE App SHALL provide a seed command that parses the `data` JavaScript array from `technical_cto_mastery_final.html` and writes all Phases, Weeks, Days, Learn Tasks, Build Tasks, Tags, goals, and SaaS Evolution notes to the SQLite database via Prisma.
2. WHEN the seed command is run and the database already contains Curriculum data, THE App SHALL skip re-inserting existing records without returning an error.
3. IF the `technical_cto_mastery_final.html` file is not found at the configured path during seeding, THEN THE App SHALL print a descriptive error message and exit with a non-zero status code.
4. THE App SHALL preserve the original week number, day order, and phase grouping from the HTML data array during seeding.

---

### Requirement 2 — Start Date Configuration

**User Story:** As a user, I want to enter my curriculum start date so that the app can calculate which week and day I am currently on.

#### Acceptance Criteria

1. THE App SHALL provide a settings screen where the user can enter and save a Start Date.
2. WHEN a Start Date is saved, THE App SHALL persist it to the SQLite database and use it for all Current Week and Current Day calculations.
3. WHEN no Start Date has been set, THE App SHALL display a prompt on the dashboard directing the user to configure a Start Date before showing week or day calculations.
4. THE App SHALL calculate the Current Week by dividing the number of elapsed days since the Start Date by 7 and mapping the result to the corresponding Week number (1–52).
5. WHEN the elapsed time exceeds 52 weeks, THE App SHALL display the user as having completed the full Curriculum rather than calculating a Week beyond 52.

---

### Requirement 3 — Current Week Dashboard

**User Story:** As a user, I want a dashboard showing my current week and today's highlighted task so that I can immediately see what to work on.

#### Acceptance Criteria

1. WHEN the user opens the App, THE App SHALL display the Current Week's title, phase, goal, and SaaS Evolution note on the dashboard.
2. THE App SHALL highlight the Current Day's Learn Task and Build Task on the dashboard.
3. THE App SHALL display overall Curriculum completion percentage and Current Phase completion percentage on the dashboard.
4. THE App SHALL display the user's current Streak count and total days studied on the dashboard.
5. WHEN the Current Week has been marked complete, THE App SHALL display a visual indicator on the dashboard distinguishing it from incomplete weeks.

---

### Requirement 4 — Daily Task View

**User Story:** As a user, I want to view and interact with each day's learn and build tasks so that I can track my daily progress.

#### Acceptance Criteria

1. THE App SHALL display all Days for a selected Week, each showing the day label, Learn Task, and Build Task.
2. WHEN the user marks a Day complete, THE App SHALL record the completion timestamp in the database and update the Week's completion percentage.
3. THE App SHALL allow the user to mark individual Days complete or incomplete independently.
4. THE App SHALL display a per-Week completion percentage calculated as the number of completed Days divided by the total Days in that Week.
5. WHEN all Days in a Week are marked complete, THE App SHALL automatically mark the Week as complete.

---

### Requirement 5 — Progress Tracking

**User Story:** As a user, I want to track my progress across all phases and weeks so that I can see how far I have come and what remains.

#### Acceptance Criteria

1. THE App SHALL display a progress overview screen listing all 52 Weeks grouped by Phase, each showing its completion status and percentage.
2. THE App SHALL calculate overall Curriculum completion percentage as the number of completed Weeks divided by 52.
3. THE App SHALL calculate per-Phase completion percentage as the number of completed Weeks in that Phase divided by the total Weeks in that Phase.
4. WHEN the user marks a Week complete from the progress overview, THE App SHALL update the completion state immediately without requiring a page reload.
5. THE App SHALL persist all completion states in the SQLite database so that progress is retained across app restarts.

---

### Requirement 6 — Streak and Consistency Tracker

**User Story:** As a user, I want to see my study streak and weekly hours so that I can stay motivated and consistent.

#### Acceptance Criteria

1. THE App SHALL calculate the current Streak as the number of consecutive calendar days ending on today on which the user marked at least one Day complete.
2. WHEN the user does not mark any Day complete on a given calendar day, THE App SHALL reset the current Streak to zero on the following day.
3. THE App SHALL display the longest Streak the user has achieved alongside the current Streak.
4. THE App SHALL display the total number of calendar days on which the user marked at least one Day complete.
5. THE App SHALL display a weekly hours input field allowing the user to log the number of hours studied for each Week, and THE App SHALL store this value in the database.
6. THE App SHALL display the cumulative total hours logged across all Weeks on the dashboard.

---

### Requirement 7 — Notes

**User Story:** As a user, I want to write notes per week and per day so that I can capture insights and questions as I study.

#### Acceptance Criteria

1. THE App SHALL provide a text input area on each Week's detail screen where the user can write and save a free-text note associated with that Week.
2. THE App SHALL provide a text input area on each Day's view where the user can write and save a free-text note associated with that Day.
3. WHEN the user saves a note, THE App SHALL persist it to the SQLite database and display it on subsequent visits to that Week or Day.
4. THE App SHALL display a visual indicator on any Week or Day card that has a saved note, so the user can identify annotated items at a glance.

---

### Requirement 8 — Build Log

**User Story:** As a user, I want to document the work I ship each week so that I have a record of my practical progress.

#### Acceptance Criteria

1. THE App SHALL provide a Build Log screen listing all Weeks in order, each with a text area for the user to enter a Build Log Entry describing shipped work.
2. WHEN the user saves a Build Log Entry, THE App SHALL persist it to the SQLite database associated with the corresponding Week.
3. THE App SHALL display all saved Build Log Entries on the Build Log screen in week-number order.
4. THE App SHALL allow the user to edit or replace an existing Build Log Entry for any Week.

---

### Requirement 9 — Resource Bookmarks

**User Story:** As a user, I want to save resource links per topic or week so that I can quickly return to useful references.

#### Acceptance Criteria

1. THE App SHALL allow the user to add a Bookmark consisting of a URL, an optional label, and an association with a specific Week or Tag.
2. THE App SHALL display all Bookmarks on a dedicated bookmarks screen, grouped by Week or Tag.
3. WHEN the user adds a Bookmark with a URL that does not begin with `http://` or `https://`, THEN THE App SHALL display a validation error and decline to save the Bookmark.
4. THE App SHALL allow the user to delete any saved Bookmark.
5. THE App SHALL persist all Bookmarks in the SQLite database.

---

### Requirement 10 — Weekly Review Prompts

**User Story:** As a user, I want structured reflection prompts at the end of each week so that I can consolidate what I learned.

#### Acceptance Criteria

1. THE App SHALL display a Weekly Review screen for each Week containing a fixed set of reflection prompts: "What did I learn?", "What did I build?", "What was difficult?", "What will I do differently next week?".
2. THE App SHALL provide a text input area for each prompt where the user can write and save a response.
3. WHEN the user saves a Weekly Review response, THE App SHALL persist it to the SQLite database associated with the corresponding Week and prompt.
4. THE App SHALL display a visual indicator on any Week that has at least one saved Weekly Review response.

---

### Requirement 11 — SaaS Evolution Timeline

**User Story:** As a user, I want a visual timeline of the SaaS evolution notes so that I can see how the project grows across all 52 weeks.

#### Acceptance Criteria

1. THE App SHALL display a SaaS Evolution Timeline screen showing all 52 Weeks in chronological order, each with its SaaS Evolution note.
2. THE App SHALL visually distinguish completed Weeks from incomplete Weeks on the timeline.
3. THE App SHALL group timeline entries by Phase, with a Phase label displayed above each group.
4. WHEN the user selects a Week on the timeline, THE App SHALL navigate to that Week's detail screen.

---

### Requirement 12 — Tag-Based Filtering

**User Story:** As a user, I want to filter weeks by topic tag so that I can focus on a specific skill area across the full curriculum.

#### Acceptance Criteria

1. THE App SHALL display a list of all unique Tags derived from the seeded Curriculum data.
2. WHEN the user selects one or more Tags, THE App SHALL filter the displayed Weeks to show only those associated with at least one of the selected Tags.
3. THE App SHALL apply tag filtering on the progress overview, the SaaS Evolution Timeline, and any week-list view.
4. WHEN no Tags are selected, THE App SHALL display all 52 Weeks without filtering.
5. THE App SHALL allow the user to clear all active tag filters with a single action.

---

### Requirement 13 — Mobile Accessibility over Home WiFi

**User Story:** As a user, I want to access the app from my mobile device on home WiFi so that I can check tasks and mark progress without being at my laptop.

#### Acceptance Criteria

1. THE App SHALL bind its HTTP server to `0.0.0.0` so that it is reachable from other devices on the local network.
2. THE App SHALL render all screens correctly on viewport widths from 375px to 1440px without horizontal scrolling.
3. THE App SHALL use touch-friendly tap targets with a minimum size of 44×44 CSS pixels for all interactive elements.
4. WHEN the app is accessed from a mobile browser, THE App SHALL display the Current Week dashboard as the default landing screen.

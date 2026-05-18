# 🚀 CTO Map

A comprehensive 52-week learning tracker designed to take you from **Senior Backend Engineer** → **Staff/Principal Engineer** → **Technical CTO**.

Built with Next.js, Prisma, Tailwind CSS, and SQLite.

![Dark Mode](https://img.shields.io/badge/Dark%20Mode-Supported-blue)
![PWA](https://img.shields.io/badge/PWA-Installable-green)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)

---

## 📖 What Is This?

CTO Map is a personal learning management system for a structured 52-week curriculum that covers:

| Phase | Weeks | Focus |
|-------|-------|-------|
| **Level 1** — Senior Backend Engineer | 1–12 | PHP internals, OOP, Laravel, databases, testing, APIs, caching, security, Linux, CI/CD |
| **Level 2** — Staff / Principal Engineer | 13–28 | Architecture, distributed systems, Kubernetes, observability, DDD, event sourcing, microservices |
| **Level 3** — Technical CTO | 29–52 | Message queues, data pipelines, AI/ML, team leadership, cost optimization, compliance, hiring |

Each week has **6 days** with paired **Learn** and **Build** tasks. You study a concept, then immediately apply it by building something.

---

## ✨ Features

### Core Learning
- 📋 **Granular task checklists** — Break each day into sub-tasks with drag-and-drop reordering
- ⏱️ **Pomodoro timer** — Built-in focus timer with session tracking
- 📝 **Daily reflection** — Micro-journal capturing key insights
- 🔄 **Spaced repetition** — Review reminders for topics you rated low confidence
- 🃏 **Flashcard mode** — Flip cards generated from your weekly reviews
- 💡 **Smart suggestions** — Auto-generates sub-tasks from task descriptions + carries over incomplete items

### Progress Tracking
- 📊 **Real-time progress** — Day-based completion (every task moves the needle)
- 🔥 **Streak tracking** — Current streak, longest streak, study day count
- 📈 **Analytics dashboard** — Completion trends, streak calendar, tag coverage, time stats
- 🗺️ **Curriculum heatmap** — 52×6 grid showing your entire year at a glance
- 🧠 **Knowledge graph** — Topics grouped by tag with connections between related areas

### Motivation
- 🏆 **Achievement system** — 10+ badges unlocked by milestones (first day, week warrior, phase master, etc.)
- ⚡ **XP & levels** — Earn XP for completing tasks, days, weeks, and reviews
- 🎯 **Weekly challenges** — Auto-generated goals like "Complete 3 days before Wednesday"
- 🎊 **Celebrations** — Animated overlay with motivational messages on day completion
- 🔥 **Burnout detection** — Gentle warnings when your pace is declining

### Organization
- 🔍 **Full-text search** — Search across notes, reviews, build logs, bookmarks, and tasks
- 📑 **Bookmarks** — Save resources grouped by week or tag
- 📓 **Build log** — Document what you ship each week
- ✍️ **Weekly reviews** — 4 structured reflection prompts per week
- 🏷️ **Tag filtering** — Filter progress and timeline by topic tags

### Technical
- 🌙 **Dark/Light/System theme** — Full dark mode support
- 📱 **Responsive** — Desktop sidebar + mobile bottom nav
- ⌨️ **Keyboard shortcuts** — Cmd+K search, T for today, [ ] for navigation
- 📤 **Export** — Download your portfolio as Markdown or sync via JSON
- 🖨️ **Print view** — Clean printable weekly plans
- 📲 **PWA** — Installable as a desktop/mobile app with offline caching

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite via Prisma ORM
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Drag & Drop**: dnd-kit
- **Testing**: Jest + fast-check (property-based testing)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repo
git clone https://github.com/510AS/cto-map.git
cd cto-map

# Install dependencies
npm install --legacy-peer-deps

# Set up the database
cp .env.example .env
npx prisma migrate dev

# Seed the curriculum data
npm run db:seed

# Start the dev server
npx next dev
```

### Environment Variables

Create a `.env` file:
```
DATABASE_URL="file:./dev.db"
```

### Seeding

The curriculum data is parsed from an HTML file. Set the path:
```
SEED_HTML_PATH=/path/to/technical_cto_mastery_final.html
```

Or place the file at `../technical_cto_mastery_final.html` (default).

---

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (30+ endpoints)
│   ├── today/             # Morning briefing page
│   ├── progress/          # Progress overview
│   ├── analytics/         # Charts and insights
│   ├── knowledge/         # Knowledge graph
│   ├── flashcards/        # Spaced repetition cards
│   ├── search/            # Full-text search
│   ├── week/[n]/          # Week detail + day detail
│   └── ...
├── components/            # 35+ React components
├── lib/                   # Utilities, contexts, validators
├── prisma/                # Schema + migrations + seed
├── public/                # PWA manifest + service worker
└── __tests__/             # 40+ test files
```

---

## 📊 Database Schema

- **Phase** → groups of weeks (3 phases)
- **Week** → 52 weeks with title, goal, SaaS evolution
- **Day** → 6 days per week with learn/build tasks
- **TaskItem** → granular sub-tasks within each day
- **ReviewResponse** → weekly reflection answers
- **BuildLogEntry** → what you shipped each week
- **Bookmark** → saved resources
- **Achievement** → unlocked badges
- **ReviewReminder** → spaced repetition schedule
- **WeeklyChallenge** — auto-generated goals

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open search |
| `T` | Go to today |
| `[` | Previous day/week |
| `]` | Next day/week |
| `?` | Show shortcuts help |

---

## 📱 Pages

| Page | Description |
|------|-------------|
| `/today` | Focused morning briefing — just today's work |
| `/` | Dashboard with stats, current week, challenges |
| `/progress` | All 52 weeks grouped by phase |
| `/analytics` | Charts, heatmap, streak calendar |
| `/knowledge` | Topic graph grouped by tags |
| `/flashcards` | Review cards from past weeks |
| `/search` | Full-text search across everything |
| `/week/[n]` | Week detail with days, notes, reviews, build log |
| `/week/[n]/day/[d]` | Day detail with tasks, timer, reflection |
| `/week/[n]/plan` | Weekly planning — bulk generate sub-tasks |
| `/achievements` | Badge gallery |
| `/settings` | Start date, theme, export/import |

---

## 🧪 Testing

```bash
npm test
```

Includes unit tests and property-based tests (fast-check) for:
- Calculation functions (streaks, completion percentages)
- API routes (CRUD operations, validation)
- Completion logic (day → week auto-complete)
- Suggestion parser
- Seed data integrity

---

## 📄 License

ISC

---

## 🙏 Acknowledgments

Built as a personal tool to track progress through a 52-week Technical CTO mastery curriculum. The curriculum covers everything from PHP internals to Kubernetes to AI agents to technical leadership.

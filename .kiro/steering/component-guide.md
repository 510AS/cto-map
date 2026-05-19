---
inclusion: fileMatch
fileMatchPattern: "components/**"
---

# Component Guide

## Component Architecture

All components are in `components/` directory. They follow these patterns:

### Layout Components
- `Navigation.tsx` — Sidebar (desktop) + bottom nav (mobile), includes XPBar and ThemeToggle
- `ErrorBoundary.tsx` — Class component wrapping main content
- `DashboardStats.tsx` — Client component reading from ProgressContext for real-time stat updates
- `DashboardTabs.tsx` — Collapsible insights section on dashboard

### Day/Task Components
- `DayRow.tsx` — Clickable card linking to day detail page. Shows: day label, task previews, completion dots, confidence, reflection icon
- `DayChecklist.tsx` — Full checklist with drag-and-drop, grouped by Learn/Build categories. Uses `useRef` for `onCompletionChange` callback to avoid infinite loops
- `TaskItemRow.tsx` — Single checklist item with checkbox, title, priority dot, time badge, resource link
- `TaskItemForm.tsx` — Inline form for adding items (title + optional priority, time estimate, note, resource URL)
- `QuickAddPanel.tsx` — Suggestions from task descriptions + carry-over from previous day
- `BulkCompleteButton.tsx` — Marks all items in a category complete

### Progress Components
- `ProgressBar.tsx` — Gradient bar that changes color by percentage (gray→amber→blue→green)
- `StreakBadge.tsx` — Current/longest streak with motivational message
- `StreakCalendar.tsx` — 7-column calendar grid (Mon-Sun) showing last 35 days
- `CurriculumHeatmap.tsx` — 52×6 grid of all days in the curriculum
- `XPBar.tsx` — Level + XP progress bar for the sidebar
- `ChecklistStats.tsx` — Average items/day, completion rate, most productive day, trend

### Feature Components
- `PomodoroTimer.tsx` — 25/15/5 min timer with localStorage persistence
- `DailyReflection.tsx` — Textarea for daily insight, auto-saves on blur
- `QuickAddResource.tsx` — URL input that creates bookmark + task item
- `CompletionCelebration.tsx` — Animated overlay on day completion
- `AchievementToast.tsx` — Special toast for newly unlocked badges
- `WeeklySummary.tsx` — This week's stats card
- `WeeklyChallenges.tsx` — Auto-generated goals with progress bars
- `BurnoutWarning.tsx` — Gentle card when declining patterns detected
- `ReviewsDueSection.tsx` — Dashboard section for spaced repetition reminders

### Form/Input Components
- `BookmarkForm.tsx` — URL + label input for adding bookmarks
- `TagFilter.tsx` — Multi-select tag pills with clear button
- `ThemeToggle.tsx` — Cycles light → dark → system
- `TodayButton.tsx` — Floating button navigating to today's day
- `KeyboardShortcuts.tsx` — Global keyboard listener + help modal

## Critical Pattern: Avoiding Infinite Loops

When a child component needs to notify a parent of state changes (like `DayChecklist` → day detail page), use a `useRef` for the callback:

```typescript
// In the child component:
const onCompletionChangeRef = useRef(onCompletionChange);
onCompletionChangeRef.current = onCompletionChange;

// In useCallback/useEffect, use the ref:
onCompletionChangeRef.current?.(learnComplete, buildComplete);
// Do NOT put onCompletionChange in the dependency array
```

## Dark Mode Checklist
When creating/modifying components, ensure:
- [ ] All `text-gray-*` have `dark:text-gray-*` counterparts
- [ ] All `bg-white` have `dark:bg-gray-900`
- [ ] All `bg-gray-50` have `dark:bg-gray-800` or `dark:bg-gray-800/50`
- [ ] All `border-gray-200` have `dark:border-gray-700` or `dark:border-gray-800`
- [ ] All `placeholder-gray-400` have `dark:placeholder-gray-500`
- [ ] Focus rings use `focus:ring-blue-500` (works in both modes)

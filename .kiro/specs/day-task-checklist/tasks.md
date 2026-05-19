# Implementation Plan: Day Task Checklist

## Overview

This plan implements granular sub-task tracking for each study day in the CTO Map. The implementation follows an incremental approach: data layer first (Prisma model, types), then core logic (completion calculator, suggestion parser), then API routes, then UI components, and finally integration/wiring. Each step builds on the previous and ends with everything connected.

## Tasks

- [x] 1. Set up data layer and core interfaces
  - [x] 1.1 Add TaskItem Prisma model and run migration
    - Add the `TaskItem` model to `prisma/schema.prisma` with fields: id, title, category, isComplete, sortOrder, timeEstimate, note, createdAt, dayId
    - Add the `taskItems TaskItem[]` relation to the existing `Day` model
    - Add the composite index `@@index([dayId, category, sortOrder])`
    - Run `npx prisma migrate dev` to generate and apply the migration
    - _Requirements: 14.1, 14.2_

  - [x] 1.2 Add TypeScript interfaces to `lib/types.ts`
    - Add `TaskItem`, `CreateTaskItemRequest`, `UpdateTaskItemRequest`, `ReorderTaskItemsRequest`, `BulkCompleteRequest`, `TaskItemSuggestion`, and `ChecklistStatsResponse` interfaces as defined in the design document
    - _Requirements: 1.1, 1.2, 4.1, 6.1, 5.4, 12.1_

- [x] 2. Implement core logic modules
  - [x] 2.1 Create `lib/completion-calculator.ts`
    - Implement a pure function `calculateDayCompletion(taskItems: TaskItem[])` that returns `{ learnComplete: boolean, buildComplete: boolean, isComplete: boolean }`
    - learnComplete = true iff all items with category "learn" are complete
    - buildComplete = true iff all items with category "build" are complete
    - isComplete = learnComplete AND buildComplete
    - When a category has zero items, preserve existing completion state (do not affect it)
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 6.2, 6.3_

  - [x] 2.2 Write property tests for completion calculator
    - **Property 4: Completion calculator correctness**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 6.2, 6.3**

  - [x] 2.3 Write property test for bulk-complete via completion calculator
    - **Property 7: Bulk-complete marks all items complete**
    - **Validates: Requirements 6.1**

  - [x] 2.4 Write property test for progress indicator correctness
    - **Property 12: Progress indicator correctness**
    - **Validates: Requirements 13.1, 13.2**

  - [x] 2.5 Create `lib/suggestion-parser.ts`
    - Implement a pure function `parseSuggestions(taskDescription: string, category: 'learn' | 'build'): TaskItemSuggestion[]`
    - Split on commas, semicolons, " and " conjunctions, and numbered list patterns (e.g., "1. ", "2. ")
    - Trim each segment and filter out empty strings
    - Return suggestions with source = 'template'
    - _Requirements: 5.4_

  - [x] 2.6 Write property test for suggestion parser
    - **Property 6: Suggestion parser splits on delimiters**
    - **Validates: Requirements 5.4**

  - [x] 2.7 Create `lib/checklist-stats.ts`
    - Implement a pure function `calculateChecklistStats(days: Array<{ dayOfWeek: number, taskItems: TaskItem[] }>, currentWeekItems: TaskItem[], previousWeekItems: TaskItem[]): ChecklistStatsResponse`
    - Calculate averageItemsPerDay, overallCompletionRate, mostProductiveDay, currentWeekRate, previousWeekRate, hasSufficientData
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 2.8 Write property test for statistics calculator
    - **Property 11: Statistics calculator correctness**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

  - [x] 2.9 Write property test for time estimate calculations
    - **Property 8: Time estimate calculations**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5**

- [x] 3. Checkpoint - Core logic verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement API routes
  - [x] 4.1 Create `app/api/task-items/route.ts` (GET and POST)
    - GET: Accept `dayId` query param, validate it, fetch task items ordered by sortOrder ascending within each category, return grouped results
    - POST: Accept `CreateTaskItemRequest` body, validate title (non-empty, non-whitespace), category ("learn" or "build"), note (max 500 chars), timeEstimate (positive number if provided)
    - On POST success: assign sortOrder = max existing sortOrder for that day+category + 1, create item, run completion calculator, update Day completion fields, return created item
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 8.1, 14.1, 14.2_

  - [x] 4.2 Write property tests for task item creation and validation
    - **Property 1: Task item creation round-trip**
    - **Property 2: Invalid input rejection**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 8.1**

  - [x] 4.3 Write property test for retrieval ordering
    - **Property 3: Retrieval ordering invariant**
    - **Validates: Requirements 2.1**

  - [x] 4.4 Create `app/api/task-items/[id]/route.ts` (PATCH and DELETE)
    - PATCH: Accept `UpdateTaskItemRequest` body, validate fields, update item, run completion calculator, update Day completion fields, return updated item
    - DELETE: Remove item, recalculate completion, update Day fields, return success
    - Handle edge case: deletion of last item in a category reverts to existing toggle behavior
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 4.5 Create `app/api/task-items/reorder/route.ts` (PATCH)
    - Accept `ReorderTaskItemsRequest` body, validate that orderedIds match existing items for that day+category
    - Update sortOrder for each item in a single transaction
    - Preserve relative order of items not involved in the move
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 4.6 Write property test for reorder stability
    - **Property 5: Reorder stability**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 4.7 Create `app/api/task-items/bulk-complete/route.ts` (POST)
    - Accept `BulkCompleteRequest` body, mark all items in the specified category as complete
    - Run completion calculator and update Day fields
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 4.8 Create `app/api/task-items/suggestions/route.ts` (GET)
    - Accept `dayId` query param, fetch the Day's learnTask/buildTask descriptions
    - Use suggestion parser to generate template suggestions
    - Query previous day (same week) for incomplete items to generate carry-over suggestions
    - Return combined suggestions array
    - _Requirements: 5.1, 5.4, 9.1, 9.2, 9.4_

  - [x] 4.9 Write property test for carry-over preservation
    - **Property 9: Carry-over preserves item data**
    - **Validates: Requirements 9.3**

  - [x] 4.10 Create `app/api/task-items/stats/route.ts` (GET)
    - Query all days with task items, use checklist-stats module to calculate statistics
    - Return `ChecklistStatsResponse`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 5. Checkpoint - API routes verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement UI components
  - [x] 6.1 Create `components/TaskItemRow.tsx`
    - Render a single checklist item with checkbox, title, optional note (secondary text), optional time estimate badge
    - Support toggle interaction (optimistic update with rollback on failure)
    - Show strikethrough and checked state when complete
    - _Requirements: 2.3, 3.1, 7.1, 8.2, 8.3_

  - [x] 6.2 Create `components/TaskItemForm.tsx`
    - Inline form for adding new task items with title input, optional time estimate, optional note
    - Client-side validation: non-empty title, note max 500 chars, positive time estimate
    - _Requirements: 1.1, 1.3, 7.1, 8.1_

  - [x] 6.3 Create `components/QuickAddPanel.tsx`
    - Display template suggestions and carry-over suggestions with visual distinction
    - Allow accepting individual suggestions or all at once
    - Call POST /api/task-items for each accepted suggestion
    - _Requirements: 5.1, 5.2, 5.3, 9.2, 9.3_

  - [x] 6.4 Create `components/BulkCompleteButton.tsx`
    - Button that calls POST /api/task-items/bulk-complete for a category
    - Only visible when at least one incomplete item exists in the category
    - _Requirements: 6.1, 6.4_

  - [x] 6.5 Create `components/DayChecklist.tsx`
    - Container component grouping task items by category ("Learn" and "Build" headings)
    - Display progress indicator (completed/total per category and overall percentage)
    - Show empty state prompt when no items exist for a category
    - Support drag-and-drop reordering within categories (call PATCH /api/task-items/reorder)
    - Include QuickAddPanel, BulkCompleteButton, and TaskItemForm
    - Display total and remaining time estimates per category
    - _Requirements: 2.1, 2.2, 2.4, 4.1, 7.2, 7.3, 7.4, 13.1, 13.2_

  - [x] 6.6 Create `components/CompletionCelebration.tsx`
    - Animated overlay with motivational message on day completion
    - Auto-dismiss after 3 seconds
    - Select message randomly from predefined set of at least 5 messages
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 6.7 Write property test for celebration message membership
    - **Property 10: Celebration message membership**
    - **Validates: Requirements 11.4**

  - [x] 6.8 Create `components/FocusModeWidget.tsx`
    - Dashboard widget showing today's checklist items
    - Allow toggling completion directly from dashboard
    - Fall back to existing Learn/Build cards when no task items exist
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 6.9 Create `components/ChecklistStats.tsx`
    - Display statistics: average items/day, completion rate, most productive day, trend
    - Show insufficient data message when fewer than 7 days of data
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 7. Integration and wiring
  - [x] 7.1 Modify `components/DayRow.tsx` to integrate DayChecklist
    - Add expandable section that renders DayChecklist component
    - Show progress indicator when task items exist
    - Fall back to existing checkbox behavior when no task items (Requirement 13.3)
    - _Requirements: 2.1, 13.1, 13.2, 13.3_

  - [x] 7.2 Modify `app/week/[weekNumber]/page.tsx` to integrate DayChecklist
    - Pass day data with task items to DayRow components
    - Fetch task items alongside day data
    - Wire CompletionCelebration to trigger on day completion
    - _Requirements: 2.1, 11.1, 14.3_

  - [x] 7.3 Modify `app/page.tsx` (Dashboard) to integrate FocusModeWidget
    - Add FocusModeWidget to the Today's Tasks section
    - Fetch current day's task items on dashboard load
    - Wire completion toggle to update day/week completion state in real time
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 7.4 Add ChecklistStats to an appropriate page section
    - Integrate ChecklistStats component into the progress page or week detail page
    - Fetch stats from GET /api/task-items/stats
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 7.5 Write unit tests for DayChecklist and FocusModeWidget
    - Test rendering with items, empty state, toggle interaction, progress display
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 10.1, 10.2_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project uses Jest with fast-check for property-based testing
- All API routes follow the existing Next.js App Router pattern in the project
- Prisma with SQLite is the existing data layer

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "2.5", "2.7"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "2.6", "2.8", "2.9"] },
    { "id": 4, "tasks": ["4.1", "4.4", "4.5", "4.7", "4.8", "4.10"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.6", "4.9"] },
    { "id": 6, "tasks": ["6.1", "6.2", "6.3", "6.4", "6.6", "6.8", "6.9"] },
    { "id": 7, "tasks": ["6.5", "6.7"] },
    { "id": 8, "tasks": ["7.1", "7.2", "7.3", "7.4"] },
    { "id": 9, "tasks": ["7.5"] }
  ]
}
```

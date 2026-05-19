# Requirements Document

## Introduction

The Day Task Checklist feature adds granular task tracking to each study day in the CTO Learning Helper application. Currently, each day has two high-level tasks (Learn and Build) that can be toggled complete. This feature introduces a detailed checklist of sub-tasks within each day, allowing users to break down their Learn and Build tasks into smaller, actionable items and track progress at a finer level of granularity.

## Glossary

- **Checklist_System**: The subsystem responsible for managing task checklist items associated with a day
- **Task_Item**: A single actionable checklist entry belonging to a day, with a title, completion state, category, optional time estimate, and optional note
- **Day**: An existing entity representing a single study day within a week, containing Learn and Build tasks
- **Category**: The classification of a Task_Item as either "learn" or "build", linking it to the parent day's task type
- **Completion_Calculator**: The subsystem responsible for computing day and week completion percentages based on Task_Item states
- **Carry-Over Suggestion**: An incomplete Task_Item from the previous day presented as a suggestion for the current day
- **Bulk-Complete**: An action that marks all Task_Items in a given category as complete in a single operation
- **Focus_Mode**: A dashboard widget that displays the current day's checklist items for direct interaction
- **Time_Estimate**: An optional duration in minutes associated with a Task_Item representing expected effort

## Requirements

### Requirement 1: Create Task Items

**User Story:** As a learner, I want to add checklist items to a day, so that I can break down my Learn and Build tasks into smaller actionable steps.

#### Acceptance Criteria

1. WHEN a user submits a new task item with a title and category for a given day, THE Checklist_System SHALL create the Task_Item and persist it to the database with an initial completion state of false
2. WHEN a user submits a new task item, THE Checklist_System SHALL assign a sort order value equal to one greater than the highest existing sort order for that day and category
3. IF a user submits a task item with an empty title, THEN THE Checklist_System SHALL reject the request and return a validation error
4. IF a user submits a task item with a category other than "learn" or "build", THEN THE Checklist_System SHALL reject the request and return a validation error

### Requirement 2: Display Task Items

**User Story:** As a learner, I want to see my checklist items grouped by category within each day, so that I can understand what specific steps remain for my Learn and Build tasks.

#### Acceptance Criteria

1. WHEN a day is displayed, THE Checklist_System SHALL retrieve all Task_Items for that day ordered by sort order ascending within each category
2. WHEN a day has Task_Items, THE Checklist_System SHALL display them grouped under their respective category headings ("Learn" and "Build")
3. WHEN a Task_Item is marked complete, THE Checklist_System SHALL display it with a visual strikethrough and checked state
4. WHEN a day has no Task_Items for a category, THE Checklist_System SHALL display a prompt to add items for that category

### Requirement 3: Toggle Task Item Completion

**User Story:** As a learner, I want to check off individual checklist items, so that I can track my progress through the detailed steps of each day.

#### Acceptance Criteria

1. WHEN a user toggles a Task_Item completion state, THE Checklist_System SHALL persist the new state to the database
2. WHEN all Task_Items in the "learn" category for a day are marked complete, THE Completion_Calculator SHALL automatically set the day's learnComplete field to true
3. WHEN all Task_Items in the "build" category for a day are marked complete, THE Completion_Calculator SHALL automatically set the day's buildComplete field to true
4. WHEN a previously complete Task_Item is unchecked, THE Completion_Calculator SHALL set the corresponding category completion (learnComplete or buildComplete) to false
5. WHEN both learnComplete and buildComplete become true through Task_Item completion, THE Completion_Calculator SHALL mark the day as complete and record the completedAt timestamp

### Requirement 4: Reorder Task Items

**User Story:** As a learner, I want to reorder my checklist items, so that I can prioritize the steps in the sequence I plan to work through them.

#### Acceptance Criteria

1. WHEN a user moves a Task_Item to a new position within the same category, THE Checklist_System SHALL update the sort order of all affected items to reflect the new ordering
2. THE Checklist_System SHALL preserve the relative order of items not involved in the move operation
3. WHEN a reorder operation is performed, THE Checklist_System SHALL persist the updated sort orders to the database in a single transaction

### Requirement 5: Quick-Add Templates

**User Story:** As a learner, I want the system to suggest checklist items based on my day's Learn and Build task descriptions, so that I can quickly populate my checklist without typing everything from scratch.

#### Acceptance Criteria

1. WHEN a user opens the add-task interface for a day with no existing Task_Items in a category, THE Checklist_System SHALL display suggested sub-tasks derived from the day's learnTask or buildTask description
2. WHEN suggested sub-tasks are displayed, THE Checklist_System SHALL allow the user to accept individual suggestions or accept all suggestions at once
3. WHEN a user accepts a suggestion, THE Checklist_System SHALL create a Task_Item with the suggested title and appropriate category
4. THE Checklist_System SHALL generate suggestions by splitting the task description on common delimiters (commas, semicolons, "and" conjunctions, numbered lists)

### Requirement 6: Bulk Completion

**User Story:** As a learner, I want to mark all checklist items in a category as done at once, so that I can quickly update my progress when I have completed multiple items in a session.

#### Acceptance Criteria

1. WHEN a user activates the bulk-complete action for a category, THE Checklist_System SHALL set all Task_Items in that category for the given day to complete
2. WHEN bulk completion is performed, THE Completion_Calculator SHALL update the day's category completion state (learnComplete or buildComplete) to true
3. WHEN all items in both categories are marked complete through bulk completion, THE Completion_Calculator SHALL mark the day as complete and record the completedAt timestamp
4. THE Checklist_System SHALL display the bulk-complete action only when at least one incomplete Task_Item exists in the category

### Requirement 7: Time Estimates

**User Story:** As a learner, I want to assign optional time estimates to each checklist item, so that I can plan my study sessions and understand how long my day's work will take.

#### Acceptance Criteria

1. WHEN a user creates or views a Task_Item, THE Checklist_System SHALL allow an optional time estimate in minutes to be associated with the item
2. WHEN Task_Items have time estimates, THE Checklist_System SHALL display the total estimated time for each category
3. WHEN Task_Items have time estimates, THE Checklist_System SHALL display the total estimated time for the entire day across both categories
4. WHEN some Task_Items are complete, THE Checklist_System SHALL display remaining estimated time calculated as the sum of estimates for incomplete items only
5. IF a user does not provide a time estimate, THEN THE Checklist_System SHALL treat the estimate as unset and exclude it from time calculations

### Requirement 8: Task Item Notes

**User Story:** As a learner, I want to add a short note or description to each checklist item, so that I can capture additional context about what the task involves.

#### Acceptance Criteria

1. WHEN a user creates a Task_Item, THE Checklist_System SHALL allow an optional note field of up to 500 characters
2. WHEN a Task_Item has a note, THE Checklist_System SHALL display the note below the task title in a smaller, secondary text style
3. WHEN a Task_Item has no note, THE Checklist_System SHALL display only the task title without additional spacing

### Requirement 9: Carry-Over Incomplete Items

**User Story:** As a learner, I want to see incomplete items from previous days surfaced as suggestions, so that I do not lose track of unfinished work.

#### Acceptance Criteria

1. WHEN a user views a day that has no Task_Items, THE Checklist_System SHALL check the previous day in the same week for incomplete Task_Items
2. WHEN incomplete items exist from the previous day, THE Checklist_System SHALL display them as carry-over suggestions with a visual indicator distinguishing them from fresh suggestions
3. WHEN a user accepts a carry-over suggestion, THE Checklist_System SHALL create a new Task_Item on the current day with the same title, category, and note as the source item
4. THE Checklist_System SHALL only suggest carry-over items from the immediately preceding day within the same week

### Requirement 10: Daily Focus Mode

**User Story:** As a learner, I want a focused view of today's checklist on the dashboard, so that I can immediately see and interact with my current tasks without navigating to the week detail page.

#### Acceptance Criteria

1. WHEN the dashboard loads and the current day has Task_Items, THE Checklist_System SHALL display an interactive checklist widget in the "Today's Tasks" section
2. WHEN displayed on the dashboard, THE Checklist_System SHALL allow users to toggle Task_Item completion directly without navigating away
3. WHEN a Task_Item is toggled on the dashboard, THE Completion_Calculator SHALL update the day and week completion states in real time
4. WHEN the current day has no Task_Items, THE Checklist_System SHALL display the existing Learn/Build task cards as the default view

### Requirement 11: Completion Celebration

**User Story:** As a learner, I want to see a motivational message or animation when I complete all checklist items for a day, so that I feel rewarded for my effort.

#### Acceptance Criteria

1. WHEN all Task_Items for a day are marked complete (across both categories), THE Checklist_System SHALL display a celebration animation and motivational message
2. THE Checklist_System SHALL display the celebration for a duration of 3 seconds before auto-dismissing
3. WHEN the day completion is triggered by bulk-complete, THE Checklist_System SHALL display the same celebration as individual item completion
4. THE Checklist_System SHALL select the motivational message randomly from a predefined set of at least 5 messages

### Requirement 12: Statistics and Insights

**User Story:** As a learner, I want to see statistics about my checklist usage and completion patterns, so that I can understand my productivity trends and improve my study habits.

#### Acceptance Criteria

1. THE Checklist_System SHALL calculate and display the average number of Task_Items created per day across all days with checklist items
2. THE Checklist_System SHALL calculate and display the overall Task_Item completion rate as a percentage of completed items versus total items
3. THE Checklist_System SHALL identify and display the user's most productive day of the week based on the highest average Task_Item completions
4. THE Checklist_System SHALL calculate and display a completion rate trend comparing the current week's rate to the previous week's rate
5. WHEN fewer than 7 days of checklist data exist, THE Checklist_System SHALL display a message indicating insufficient data for trend analysis

### Requirement 13: Day Completion Progress Indicator

**User Story:** As a learner, I want to see a progress indicator showing how many checklist items I have completed for each day, so that I can quickly gauge my progress.

#### Acceptance Criteria

1. WHEN a day has Task_Items, THE Checklist_System SHALL display a progress indicator showing the count of completed items versus total items per category
2. WHEN a day has Task_Items, THE Checklist_System SHALL display an overall completion percentage calculated as completed items divided by total items across both categories
3. WHEN a day has no Task_Items, THE Checklist_System SHALL fall back to displaying the existing Learn/Build checkbox completion state

### Requirement 14: Persist Task Items Across Sessions

**User Story:** As a learner, I want my checklist items and their completion states to be saved, so that I can close the app and return later without losing progress.

#### Acceptance Criteria

1. THE Checklist_System SHALL store Task_Items in the SQLite database using Prisma ORM
2. THE Checklist_System SHALL include a createdAt timestamp on each Task_Item
3. WHEN the application loads a day view, THE Checklist_System SHALL restore all Task_Items with their persisted completion states and sort orders

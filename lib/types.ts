/**
 * Shared TypeScript interfaces used across the CTO Learning Helper app.
 *
 * These types represent the application's domain model and are used by
 * components, API routes, and utility functions.
 */

// =============================================================================
// Core Domain Models
// =============================================================================

/** Application settings (single row in DB). */
export interface Settings {
  id: number;
  startDate: string | null; // ISO date string
  updatedAt: string;
}

/** A named group of weeks within the curriculum. */
export interface Phase {
  id: number;
  name: string;
  badge: string;
  sortOrder: number;
  weeks?: Week[];
}

/** One of the 52 curriculum weeks. */
export interface Week {
  id: number;
  weekNumber: number;
  title: string;
  goal: string;
  saasEvolution: string;
  isComplete: boolean;
  hoursLogged: number | null;
  note: string | null;
  phaseId: number;
  phase?: Phase;
  days?: Day[];
  tags?: WeekTag[];
  buildLogEntry?: BuildLogEntry | null;
  reviewResponses?: ReviewResponse[];
  bookmarks?: Bookmark[];
}

/** A single study day within a week. */
export interface Day {
  id: number;
  dayLabel: string;
  learnTask: string;
  buildTask: string;
  sortOrder: number;
  isComplete: boolean;
  learnComplete: boolean;
  buildComplete: boolean;
  completedAt: string | null; // ISO datetime string
  note: string | null;
  weekId: number;
  week?: Week;
}

/** A topic label attached to one or more weeks. */
export interface Tag {
  id: number;
  name: string;
  weeks?: WeekTag[];
  bookmarks?: Bookmark[];
}

/** Join table linking weeks and tags. */
export interface WeekTag {
  weekId: number;
  tagId: number;
  week?: Week;
  tag?: Tag;
}

/** A free-text record of shipped work associated with a week. */
export interface BuildLogEntry {
  id: number;
  content: string;
  weekId: number;
  week?: Week;
  updatedAt: string;
}

/** A URL and optional label saved by the user. */
export interface Bookmark {
  id: number;
  url: string;
  label: string | null;
  weekId: number | null;
  tagId: number | null;
  week?: Week | null;
  tag?: Tag | null;
  createdAt: string;
}

/** A structured reflection response for a weekly review prompt. */
export interface ReviewResponse {
  id: number;
  weekId: number;
  prompt: ReviewPromptType;
  response: string;
  week?: Week;
  updatedAt: string;
}

// =============================================================================
// Enums and Literal Types
// =============================================================================

/** The four fixed weekly review prompts. */
export type ReviewPromptType = 'learned' | 'built' | 'difficult' | 'differently';

// =============================================================================
// Seed Parser Types
// =============================================================================

/** A parsed day from the HTML data file. */
export interface ParsedDay {
  dayLabel: string;
  learnTask: string;
  buildTask: string;
  sortOrder: number;
}

/** A parsed week from the HTML data file. */
export interface ParsedWeek {
  weekNumber: number;
  title: string;
  tags: string[];
  days: ParsedDay[];
  goal: string;
  saasEvolution: string;
}

/** A parsed phase from the HTML data file. */
export interface ParsedPhase {
  name: string;
  badge: string;
  sortOrder: number;
  weeks: ParsedWeek[];
}

// =============================================================================
// Calculation Types
// =============================================================================

/** Dashboard statistics displayed on the main page. */
export interface DashboardStats {
  currentWeekNumber: number;
  overallCompletionPct: number;
  phaseCompletionPct: number;
  currentStreak: number;
  longestStreak: number;
  totalStudyDays: number;
  cumulativeHours: number;
}

/** Completion summary for a week. */
export interface WeekCompletionSummary {
  weekId: number;
  weekNumber: number;
  completedDays: number;
  totalDays: number;
  completionPct: number;
  isComplete: boolean;
}

// =============================================================================
// API Request / Response Types
// =============================================================================

/** PUT /api/settings request body. */
export interface UpdateSettingsRequest {
  startDate: string; // ISO date string
}

/** GET /api/settings response body. */
export interface SettingsResponse {
  startDate: string | null;
}

/** PATCH /api/days/[dayId] request body. */
export interface UpdateDayRequest {
  isComplete: boolean;
}

/** PATCH /api/days/[dayId] response body. */
export interface UpdateDayResponse extends Day {
  weekIsComplete: boolean;
}

/** PATCH /api/weeks/[weekId] request body. */
export interface UpdateWeekRequest {
  isComplete?: boolean;
  hoursLogged?: number;
}

/** POST/PUT /api/notes request body. */
export interface SaveNoteRequest {
  weekId?: number;
  dayId?: number;
  content: string;
}

/** POST/PUT /api/build-log request body. */
export interface SaveBuildLogRequest {
  weekId: number;
  content: string;
}

/** POST /api/bookmarks request body. */
export interface CreateBookmarkRequest {
  url: string;
  label?: string;
  weekId?: number;
  tagId?: number;
}

/** DELETE /api/bookmarks request body. */
export interface DeleteBookmarkRequest {
  id: number;
}

/** POST/PUT /api/reviews request body. */
export interface SaveReviewRequest {
  weekId: number;
  prompt: ReviewPromptType;
  response: string;
}

// =============================================================================
// UI Component Props Types
// =============================================================================

/** Props for the ProgressBar component. */
export interface ProgressBarProps {
  percentage: number;
  label?: string;
}

/** Props for the StreakBadge component. */
export interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
}

/** Props for the TagFilter component. */
export interface TagFilterProps {
  tags: Tag[];
  selectedTagIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
}

/** Props for the WeekCard component. */
export interface WeekCardProps {
  week: Week & {
    days: Day[];
    tags: (WeekTag & { tag: Tag })[];
    buildLogEntry: BuildLogEntry | null;
    reviewResponses: ReviewResponse[];
  };
  completionPct: number;
  hasNote: boolean;
  hasReview: boolean;
}

/** Props for the DayRow component. */
export interface DayRowProps {
  day: Day;
  onToggleComplete: (dayId: number, isComplete: boolean) => void;
}

/** Props for the NoteEditor component. */
export interface NoteEditorProps {
  initialContent: string;
  weekId?: number;
  dayId?: number;
  onSave: (content: string) => void;
}

/** Props for the BuildLogEntry component. */
export interface BuildLogEntryProps {
  weekId: number;
  weekNumber: number;
  initialContent: string;
  onSave: (content: string) => void;
}

/** Props for the BookmarkForm component. */
export interface BookmarkFormProps {
  weekId?: number;
  tagId?: number;
  onBookmarkAdded: (bookmark: Bookmark) => void;
}

/** Props for the ReviewPrompts component. */
export interface ReviewPromptsProps {
  weekId: number;
  existingResponses: ReviewResponse[];
  onSave: (prompt: ReviewPromptType, response: string) => void;
}

/** Props for the TimelineEntry component. */
export interface TimelineEntryProps {
  week: Week;
  isComplete: boolean;
}

// =============================================================================
// Day Task Checklist Types
// =============================================================================

/** A single checklist item within a day. */
export interface TaskItem {
  id: number;
  title: string;
  category: 'learn' | 'build';
  isComplete: boolean;
  sortOrder: number;
  timeEstimate: number | null;
  note: string | null;
  createdAt: string; // ISO datetime
  dayId: number;
}

/** Request body for creating a task item. */
export interface CreateTaskItemRequest {
  dayId: number;
  title: string;
  category: 'learn' | 'build';
  timeEstimate?: number;
  note?: string;
}

/** Request body for updating a task item. */
export interface UpdateTaskItemRequest {
  isComplete?: boolean;
  title?: string;
  timeEstimate?: number | null;
  note?: string | null;
}

/** Request body for reordering task items. */
export interface ReorderTaskItemsRequest {
  dayId: number;
  category: 'learn' | 'build';
  orderedIds: number[]; // task item IDs in desired order
}

/** Request body for bulk completion. */
export interface BulkCompleteRequest {
  dayId: number;
  category: 'learn' | 'build';
}

/** Suggestion item returned by the suggestions endpoint. */
export interface TaskItemSuggestion {
  title: string;
  category: 'learn' | 'build';
  source: 'template' | 'carry-over';
  sourceNote?: string | null;
}

/** Checklist statistics response. */
export interface ChecklistStatsResponse {
  averageItemsPerDay: number;
  overallCompletionRate: number;
  mostProductiveDay: string | null; // day of week name
  currentWeekRate: number;
  previousWeekRate: number;
  hasSufficientData: boolean;
}

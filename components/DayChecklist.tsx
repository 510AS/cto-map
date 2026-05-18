'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskItem, ReorderTaskItemsRequest } from '@/lib/types';
import { calculateTimeEstimates } from '@/lib/time-estimates';
import { useToast } from '@/lib/toast-context';
import TaskItemRow from './TaskItemRow';
import TaskItemForm from './TaskItemForm';
import QuickAddPanel from './QuickAddPanel';
import BulkCompleteButton from './BulkCompleteButton';

interface DayChecklistProps {
  dayId: number;
  onCompletionChange?: (learnComplete: boolean, buildComplete: boolean) => void;
}

/**
 * DayChecklist is the container component that groups task items by category
 * ("Learn" and "Build" headings), displays progress indicators, supports
 * drag-and-drop reordering, and integrates QuickAddPanel, BulkCompleteButton,
 * and TaskItemForm sub-components.
 *
 * Requirements: 2.1, 2.2, 2.4, 4.1, 7.2, 7.3, 7.4, 13.1, 13.2
 */
export default function DayChecklist({ dayId, onCompletionChange }: DayChecklistProps) {
  const [items, setItems] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Use a ref for the callback to avoid infinite loops in useCallback deps
  const onCompletionChangeRef = useRef(onCompletionChange);
  onCompletionChangeRef.current = onCompletionChange;

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/task-items?dayId=${dayId}`);
      if (!res.ok) throw new Error('Failed to fetch task items');
      const data = await res.json();
      const learnItems: TaskItem[] = data.learn ?? [];
      const buildItems: TaskItem[] = data.build ?? [];
      const allItems = [...learnItems, ...buildItems];
      setItems(allItems);

      // Notify parent of completion state
      if (onCompletionChangeRef.current && allItems.length > 0) {
        const learnComplete = learnItems.length > 0 && learnItems.every((i) => i.isComplete);
        const buildComplete = buildItems.length > 0 && buildItems.every((i) => i.isComplete);
        onCompletionChangeRef.current(learnComplete, buildComplete);
      }
    } catch {
      showToast('Failed to load checklist items', 'error');
    } finally {
      setLoading(false);
    }
  }, [dayId, showToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const learnItems = items
    .filter((item) => item.category === 'learn')
    .sort((a, b) => {
      // Sort hard first, then medium, then easy, then no priority
      const priorityOrder = { hard: 0, medium: 1, easy: 2 };
      const aPriority = (a as any).priority as string | null;
      const bPriority = (b as any).priority as string | null;
      const aOrder = aPriority ? (priorityOrder[aPriority as keyof typeof priorityOrder] ?? 3) : 3;
      const bOrder = bPriority ? (priorityOrder[bPriority as keyof typeof priorityOrder] ?? 3) : 3;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.sortOrder - b.sortOrder;
    });

  const buildItems = items
    .filter((item) => item.category === 'build')
    .sort((a, b) => {
      const priorityOrder = { hard: 0, medium: 1, easy: 2 };
      const aPriority = (a as any).priority as string | null;
      const bPriority = (b as any).priority as string | null;
      const aOrder = aPriority ? (priorityOrder[aPriority as keyof typeof priorityOrder] ?? 3) : 3;
      const bOrder = bPriority ? (priorityOrder[bPriority as keyof typeof priorityOrder] ?? 3) : 3;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.sortOrder - b.sortOrder;
    });

  const learnCompleted = learnItems.filter((i) => i.isComplete).length;
  const buildCompleted = buildItems.filter((i) => i.isComplete).length;
  const totalItems = items.length;
  const totalCompleted = learnCompleted + buildCompleted;
  const overallPercentage = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  const learnTimeEstimates = calculateTimeEstimates(learnItems);
  const buildTimeEstimates = calculateTimeEstimates(buildItems);

  const handleItemToggled = (updatedItem: TaskItem) => {
    setItems((prev) => {
      const newItems = prev.map((item) => (item.id === updatedItem.id ? updatedItem : item));
      // Check if all items in each category are complete
      if (onCompletionChangeRef.current) {
        const learnItems = newItems.filter((i) => i.category === 'learn');
        const buildItems = newItems.filter((i) => i.category === 'build');
        const learnComplete = learnItems.length > 0 && learnItems.every((i) => i.isComplete);
        const buildComplete = buildItems.length > 0 && buildItems.every((i) => i.isComplete);
        onCompletionChangeRef.current(learnComplete, buildComplete);
      }
      return newItems;
    });
  };

  const handleReorder = async (category: 'learn' | 'build', orderedIds: number[]) => {
    // Optimistic update
    const previousItems = [...items];
    setItems((prev) =>
      prev.map((item) => {
        const newIndex = orderedIds.indexOf(item.id);
        if (newIndex !== -1) {
          return { ...item, sortOrder: newIndex };
        }
        return item;
      })
    );

    try {
      const body: ReorderTaskItemsRequest = { dayId, category, orderedIds };
      const res = await fetch('/api/task-items/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error('Reorder failed');
      }
    } catch {
      // Rollback on failure
      setItems(previousItems);
      showToast('Failed to reorder items — please try again', 'error');
    }
  };

  const handleItemCreated = () => {
    fetchItems();
  };

  const handleBulkComplete = () => {
    fetchItems();
  };

  const handleSuggestionsAccepted = () => {
    fetchItems();
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Loading checklist...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      {totalItems > 0 && (
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0">
            {overallPercentage}% complete
          </span>
        </div>
      )}

      {/* Quick Add Panel */}
      <QuickAddPanel dayId={dayId} onSuggestionsAccepted={handleSuggestionsAccepted} />

      {/* Learn Category */}
      <CategorySection
        category="learn"
        label="Learn"
        items={learnItems}
        completedCount={learnCompleted}
        timeEstimates={learnTimeEstimates}
        dayId={dayId}
        onItemToggled={handleItemToggled}
        onReorder={(orderedIds) => handleReorder('learn', orderedIds)}
        onItemCreated={handleItemCreated}
        onBulkComplete={handleBulkComplete}
      />

      {/* Build Category */}
      <CategorySection
        category="build"
        label="Build"
        items={buildItems}
        completedCount={buildCompleted}
        timeEstimates={buildTimeEstimates}
        dayId={dayId}
        onItemToggled={handleItemToggled}
        onReorder={(orderedIds) => handleReorder('build', orderedIds)}
        onItemCreated={handleItemCreated}
        onBulkComplete={handleBulkComplete}
      />
    </div>
  );
}


// =============================================================================
// CategorySection Sub-component
// =============================================================================

interface CategorySectionProps {
  category: 'learn' | 'build';
  label: string;
  items: TaskItem[];
  completedCount: number;
  timeEstimates: { totalMinutes: number; remainingMinutes: number };
  dayId: number;
  onItemToggled: (updatedItem: TaskItem) => void;
  onReorder: (orderedIds: number[]) => void;
  onItemCreated: () => void;
  onBulkComplete: () => void;
}

function CategorySection({
  category,
  label,
  items,
  completedCount,
  timeEstimates,
  dayId,
  onItemToggled,
  onReorder,
  onItemCreated,
  onBulkComplete,
}: CategorySectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const totalCount = items.length;
  const hasIncompleteItems = items.some((item) => !item.isComplete);

  const headerColor =
    category === 'learn'
      ? 'text-purple-700 dark:text-purple-300'
      : 'text-emerald-700 dark:text-emerald-300';

  const borderColor =
    category === 'learn'
      ? 'border-purple-200 dark:border-purple-800'
      : 'border-emerald-200 dark:border-emerald-800';

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    const orderedIds = reordered.map((item) => item.id);
    onReorder(orderedIds);
  }

  return (
    <section
      className={`rounded-lg border ${borderColor} overflow-hidden`}
      aria-label={`${label} tasks`}
    >
      {/* Category Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <h3 className={`text-sm font-semibold ${headerColor}`}>{label}</h3>
          {totalCount > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Time estimates */}
          {timeEstimates.totalMinutes > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                {timeEstimates.remainingMinutes}m left / {timeEstimates.totalMinutes}m total
              </span>
            </div>
          )}
          {/* Bulk Complete Button */}
          <BulkCompleteButton
            dayId={dayId}
            category={category}
            hasIncompleteItems={hasIncompleteItems}
            onComplete={onBulkComplete}
          />
        </div>
      </div>

      {/* Items List */}
      <div className="p-3 space-y-1">
        {totalCount === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
            No {label.toLowerCase()} items yet. Add one below to get started.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item) => (
                <SortableTaskItem key={item.id} item={item} onToggled={onItemToggled} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add Item Form */}
      <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-700/50">
        <TaskItemForm dayId={dayId} category={category} onItemCreated={onItemCreated} />
      </div>
    </section>
  );
}

// =============================================================================
// SortableTaskItem Sub-component (drag-and-drop wrapper)
// =============================================================================

interface SortableTaskItemProps {
  item: TaskItem;
  onToggled: (updatedItem: TaskItem) => void;
}

function SortableTaskItem({ item, onToggled }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 ${isDragging ? 'opacity-50 z-10' : ''}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 touch-none"
        aria-label={`Drag to reorder "${item.title}"`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
        </svg>
      </button>

      {/* Task Item Row */}
      <div className="flex-1 min-w-0">
        <TaskItemRow item={item} onToggled={onToggled} />
      </div>
    </div>
  );
}

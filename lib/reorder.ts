import { TaskItem } from './types';

/**
 * Pure function that reorders task items according to the given ordered list of IDs.
 *
 * Takes an array of items and an ordered list of IDs, and returns the items
 * with updated sortOrder values reflecting the new ordering.
 *
 * @param items - The current task items to reorder
 * @param orderedIds - The IDs in the desired new order
 * @returns A new array of items with updated sortOrder values
 */
export function applyReorder(items: TaskItem[], orderedIds: number[]): TaskItem[] {
  const idToIndex = new Map<number, number>();
  for (let i = 0; i < orderedIds.length; i++) {
    idToIndex.set(orderedIds[i], i);
  }

  return items.map((item) => {
    const newSortOrder = idToIndex.get(item.id);
    if (newSortOrder !== undefined) {
      return { ...item, sortOrder: newSortOrder };
    }
    return item;
  });
}

import { calculateDayCompletion } from '../lib/completion-calculator';
import { TaskItem } from '../lib/types';

function makeTaskItem(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: 1,
    title: 'Test task',
    category: 'learn',
    isComplete: false,
    sortOrder: 0,
    timeEstimate: null,
    note: null,
    createdAt: new Date().toISOString(),
    dayId: 1,
    ...overrides,
  };
}

describe('calculateDayCompletion', () => {
  describe('learnComplete', () => {
    it('returns true when all learn items are complete', () => {
      const items: TaskItem[] = [
        makeTaskItem({ id: 1, category: 'learn', isComplete: true }),
        makeTaskItem({ id: 2, category: 'learn', isComplete: true }),
      ];
      const result = calculateDayCompletion(items);
      expect(result.learnComplete).toBe(true);
    });

    it('returns false when any learn item is incomplete', () => {
      const items: TaskItem[] = [
        makeTaskItem({ id: 1, category: 'learn', isComplete: true }),
        makeTaskItem({ id: 2, category: 'learn', isComplete: false }),
      ];
      const result = calculateDayCompletion(items);
      expect(result.learnComplete).toBe(false);
    });

    it('preserves existing state when no learn items exist', () => {
      const items: TaskItem[] = [
        makeTaskItem({ id: 1, category: 'build', isComplete: true }),
      ];
      const result = calculateDayCompletion(items, {
        learnComplete: true,
        buildComplete: false,
      });
      expect(result.learnComplete).toBe(true);
    });

    it('defaults to false when no learn items and no existing state', () => {
      const items: TaskItem[] = [
        makeTaskItem({ id: 1, category: 'build', isComplete: true }),
      ];
      const result = calculateDayCompletion(items);
      expect(result.learnComplete).toBe(false);
    });
  });

  describe('buildComplete', () => {
    it('returns true when all build items are complete', () => {
      const items: TaskItem[] = [
        makeTaskItem({ id: 1, category: 'build', isComplete: true }),
        makeTaskItem({ id: 2, category: 'build', isComplete: true }),
      ];
      const result = calculateDayCompletion(items);
      expect(result.buildComplete).toBe(true);
    });

    it('returns false when any build item is incomplete', () => {
      const items: TaskItem[] = [
        makeTaskItem({ id: 1, category: 'build', isComplete: true }),
        makeTaskItem({ id: 2, category: 'build', isComplete: false }),
      ];
      const result = calculateDayCompletion(items);
      expect(result.buildComplete).toBe(false);
    });

    it('preserves existing state when no build items exist', () => {
      const items: TaskItem[] = [
        makeTaskItem({ id: 1, category: 'learn', isComplete: true }),
      ];
      const result = calculateDayCompletion(items, {
        learnComplete: false,
        buildComplete: true,
      });
      expect(result.buildComplete).toBe(true);
    });
  });

  describe('isComplete', () => {
    it('returns true when both categories are complete', () => {
      const items: TaskItem[] = [
        makeTaskItem({ id: 1, category: 'learn', isComplete: true }),
        makeTaskItem({ id: 2, category: 'build', isComplete: true }),
      ];
      const result = calculateDayCompletion(items);
      expect(result.isComplete).toBe(true);
    });

    it('returns false when learn is incomplete', () => {
      const items: TaskItem[] = [
        makeTaskItem({ id: 1, category: 'learn', isComplete: false }),
        makeTaskItem({ id: 2, category: 'build', isComplete: true }),
      ];
      const result = calculateDayCompletion(items);
      expect(result.isComplete).toBe(false);
    });

    it('returns false when build is incomplete', () => {
      const items: TaskItem[] = [
        makeTaskItem({ id: 1, category: 'learn', isComplete: true }),
        makeTaskItem({ id: 2, category: 'build', isComplete: false }),
      ];
      const result = calculateDayCompletion(items);
      expect(result.isComplete).toBe(false);
    });

    it('uses preserved state for isComplete calculation', () => {
      // No learn items, existing learnComplete=true, build items all complete
      const items: TaskItem[] = [
        makeTaskItem({ id: 1, category: 'build', isComplete: true }),
      ];
      const result = calculateDayCompletion(items, {
        learnComplete: true,
        buildComplete: false,
      });
      expect(result.isComplete).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles empty task items array with default state', () => {
      const result = calculateDayCompletion([]);
      expect(result.learnComplete).toBe(false);
      expect(result.buildComplete).toBe(false);
      expect(result.isComplete).toBe(false);
    });

    it('handles empty task items array with existing state preserved', () => {
      const result = calculateDayCompletion([], {
        learnComplete: true,
        buildComplete: true,
      });
      expect(result.learnComplete).toBe(true);
      expect(result.buildComplete).toBe(true);
      expect(result.isComplete).toBe(true);
    });

    it('handles single learn item complete', () => {
      const items: TaskItem[] = [
        makeTaskItem({ id: 1, category: 'learn', isComplete: true }),
      ];
      const result = calculateDayCompletion(items);
      expect(result.learnComplete).toBe(true);
      expect(result.buildComplete).toBe(false);
      expect(result.isComplete).toBe(false);
    });

    it('handles many items in both categories', () => {
      const items: TaskItem[] = [
        makeTaskItem({ id: 1, category: 'learn', isComplete: true }),
        makeTaskItem({ id: 2, category: 'learn', isComplete: true }),
        makeTaskItem({ id: 3, category: 'learn', isComplete: true }),
        makeTaskItem({ id: 4, category: 'build', isComplete: true }),
        makeTaskItem({ id: 5, category: 'build', isComplete: true }),
      ];
      const result = calculateDayCompletion(items);
      expect(result.learnComplete).toBe(true);
      expect(result.buildComplete).toBe(true);
      expect(result.isComplete).toBe(true);
    });
  });
});

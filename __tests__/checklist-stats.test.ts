import { calculateChecklistStats } from '@/lib/checklist-stats';
import { TaskItem } from '@/lib/types';

function makeTaskItem(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: 1,
    title: 'Test item',
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

describe('calculateChecklistStats', () => {
  it('returns zeros when no days have items', () => {
    const result = calculateChecklistStats([], [], []);
    expect(result.averageItemsPerDay).toBe(0);
    expect(result.overallCompletionRate).toBe(0);
    expect(result.mostProductiveDay).toBeNull();
    expect(result.currentWeekRate).toBe(0);
    expect(result.previousWeekRate).toBe(0);
    expect(result.hasSufficientData).toBe(false);
  });

  it('calculates averageItemsPerDay correctly', () => {
    const days = [
      { dayOfWeek: 1, taskItems: [makeTaskItem(), makeTaskItem(), makeTaskItem()] },
      { dayOfWeek: 2, taskItems: [makeTaskItem()] },
    ];
    const result = calculateChecklistStats(days, [], []);
    // 4 items / 2 days = 2
    expect(result.averageItemsPerDay).toBe(2);
  });

  it('calculates overallCompletionRate correctly', () => {
    const days = [
      {
        dayOfWeek: 1,
        taskItems: [
          makeTaskItem({ isComplete: true }),
          makeTaskItem({ isComplete: true }),
          makeTaskItem({ isComplete: false }),
          makeTaskItem({ isComplete: false }),
        ],
      },
    ];
    const result = calculateChecklistStats(days, [], []);
    // 2 completed / 4 total = 50%
    expect(result.overallCompletionRate).toBe(50);
  });

  it('identifies the most productive day of the week', () => {
    const days = [
      // Monday with 3 completed
      {
        dayOfWeek: 1,
        taskItems: [
          makeTaskItem({ isComplete: true }),
          makeTaskItem({ isComplete: true }),
          makeTaskItem({ isComplete: true }),
        ],
      },
      // Tuesday with 1 completed
      {
        dayOfWeek: 2,
        taskItems: [
          makeTaskItem({ isComplete: true }),
          makeTaskItem({ isComplete: false }),
        ],
      },
    ];
    const result = calculateChecklistStats(days, [], []);
    expect(result.mostProductiveDay).toBe('Monday');
  });

  it('averages across multiple occurrences of the same day of week', () => {
    const days = [
      // Monday week 1: 4 completed
      {
        dayOfWeek: 1,
        taskItems: [
          makeTaskItem({ isComplete: true }),
          makeTaskItem({ isComplete: true }),
          makeTaskItem({ isComplete: true }),
          makeTaskItem({ isComplete: true }),
        ],
      },
      // Monday week 2: 2 completed
      {
        dayOfWeek: 1,
        taskItems: [
          makeTaskItem({ isComplete: true }),
          makeTaskItem({ isComplete: true }),
          makeTaskItem({ isComplete: false }),
        ],
      },
      // Tuesday: 5 completed
      {
        dayOfWeek: 2,
        taskItems: [
          makeTaskItem({ isComplete: true }),
          makeTaskItem({ isComplete: true }),
          makeTaskItem({ isComplete: true }),
          makeTaskItem({ isComplete: true }),
          makeTaskItem({ isComplete: true }),
        ],
      },
    ];
    const result = calculateChecklistStats(days, [], []);
    // Monday average: (4+2)/2 = 3, Tuesday average: 5/1 = 5
    expect(result.mostProductiveDay).toBe('Tuesday');
  });

  it('calculates currentWeekRate and previousWeekRate', () => {
    const currentWeekItems = [
      makeTaskItem({ isComplete: true }),
      makeTaskItem({ isComplete: true }),
      makeTaskItem({ isComplete: false }),
      makeTaskItem({ isComplete: false }),
    ];
    const previousWeekItems = [
      makeTaskItem({ isComplete: true }),
      makeTaskItem({ isComplete: false }),
      makeTaskItem({ isComplete: false }),
    ];
    const result = calculateChecklistStats([], currentWeekItems, previousWeekItems);
    // current: 2/4 = 50%, previous: 1/3 ≈ 33.33%
    expect(result.currentWeekRate).toBe(50);
    expect(result.previousWeekRate).toBeCloseTo(33.33, 1);
  });

  it('sets hasSufficientData to true when 7 or more days have items', () => {
    const days = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i % 7,
      taskItems: [makeTaskItem()],
    }));
    const result = calculateChecklistStats(days, [], []);
    expect(result.hasSufficientData).toBe(true);
  });

  it('sets hasSufficientData to false when fewer than 7 days have items', () => {
    const days = Array.from({ length: 6 }, (_, i) => ({
      dayOfWeek: i % 7,
      taskItems: [makeTaskItem()],
    }));
    const result = calculateChecklistStats(days, [], []);
    expect(result.hasSufficientData).toBe(false);
  });

  it('ignores days with empty taskItems arrays', () => {
    const days = [
      { dayOfWeek: 1, taskItems: [makeTaskItem(), makeTaskItem()] },
      { dayOfWeek: 2, taskItems: [] }, // should be excluded
      { dayOfWeek: 3, taskItems: [makeTaskItem()] },
    ];
    const result = calculateChecklistStats(days, [], []);
    // Only 2 days count, 3 total items
    expect(result.averageItemsPerDay).toBe(1.5);
  });
});

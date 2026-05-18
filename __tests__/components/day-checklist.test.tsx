/**
 * Unit tests for DayChecklist and FocusModeWidget components.
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 10.1, 10.2
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { TaskItem } from '@/lib/types';

// --- Mocks ---

// Mock @dnd-kit modules since DayChecklist uses drag-and-drop
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
}));

jest.mock('@dnd-kit/sortable', () => ({
  arrayMove: jest.fn((arr: unknown[], from: number, to: number) => {
    const result = [...arr];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  }),
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  sortableKeyboardCoordinates: jest.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: jest.fn(),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => undefined,
    },
  },
}));

// Mock toast context
const mockShowToast = jest.fn();
jest.mock('@/lib/toast-context', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock QuickAddPanel, BulkCompleteButton, TaskItemForm to simplify DayChecklist tests
jest.mock('@/components/QuickAddPanel', () => {
  return function MockQuickAddPanel() {
    return <div data-testid="quick-add-panel">QuickAddPanel</div>;
  };
});

jest.mock('@/components/BulkCompleteButton', () => {
  return function MockBulkCompleteButton({ category }: { category: string }) {
    return <div data-testid={`bulk-complete-${category}`}>BulkComplete</div>;
  };
});

jest.mock('@/components/TaskItemForm', () => {
  return function MockTaskItemForm({ category }: { category: string }) {
    return <div data-testid={`task-item-form-${category}`}>TaskItemForm</div>;
  };
});

// Import components after mocks
import DayChecklist from '@/components/DayChecklist';
import FocusModeWidget from '@/components/FocusModeWidget';

// --- Test Data ---

const mockLearnItems: TaskItem[] = [
  {
    id: 1,
    title: 'Read chapter 5',
    category: 'learn',
    isComplete: true,
    sortOrder: 0,
    timeEstimate: 30,
    note: 'Focus on design patterns',
    createdAt: '2024-01-01T00:00:00Z',
    dayId: 1,
  },
  {
    id: 2,
    title: 'Watch video lecture',
    category: 'learn',
    isComplete: false,
    sortOrder: 1,
    timeEstimate: 45,
    note: null,
    createdAt: '2024-01-01T00:00:00Z',
    dayId: 1,
  },
];

const mockBuildItems: TaskItem[] = [
  {
    id: 3,
    title: 'Implement auth module',
    category: 'build',
    isComplete: false,
    sortOrder: 0,
    timeEstimate: 60,
    note: 'Use JWT tokens',
    createdAt: '2024-01-01T00:00:00Z',
    dayId: 1,
  },
  {
    id: 4,
    title: 'Write unit tests',
    category: 'build',
    isComplete: true,
    sortOrder: 1,
    timeEstimate: 20,
    note: null,
    createdAt: '2024-01-01T00:00:00Z',
    dayId: 1,
  },
];

const allItems: TaskItem[] = [...mockLearnItems, ...mockBuildItems];

// --- Helper ---

function mockFetchSuccess(data: unknown) {
  (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
  });
}

function mockFetchFailure() {
  (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: 'Failed' }),
  });
}

// --- DayChecklist Tests ---

describe('DayChecklist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders items grouped by category', async () => {
    mockFetchSuccess(allItems);

    render(<DayChecklist dayId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Read chapter 5')).toBeInTheDocument();
    });

    // Verify Learn category items
    expect(screen.getByText('Read chapter 5')).toBeInTheDocument();
    expect(screen.getByText('Watch video lecture')).toBeInTheDocument();

    // Verify Build category items
    expect(screen.getByText('Implement auth module')).toBeInTheDocument();
    expect(screen.getByText('Write unit tests')).toBeInTheDocument();

    // Verify category headings
    expect(screen.getByText('Learn')).toBeInTheDocument();
    expect(screen.getByText('Build')).toBeInTheDocument();
  });

  it('shows empty state when no items exist', async () => {
    mockFetchSuccess([]);

    render(<DayChecklist dayId={1} />);

    await waitFor(() => {
      expect(
        screen.getByText('No learn items yet. Add one below to get started.')
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('No build items yet. Add one below to get started.')
    ).toBeInTheDocument();
  });

  it('shows progress indicator with correct percentage', async () => {
    // 2 out of 4 items complete = 50%
    mockFetchSuccess(allItems);

    render(<DayChecklist dayId={1} />);

    await waitFor(() => {
      expect(screen.getByText('50% complete')).toBeInTheDocument();
    });
  });

  it('shows per-category completion counts', async () => {
    mockFetchSuccess(allItems);

    render(<DayChecklist dayId={1} />);

    await waitFor(() => {
      // Learn: 1/2, Build: 1/2
      const counts = screen.getAllByText('1/2');
      expect(counts.length).toBe(2);
    });
  });

  it('does not show progress bar when no items exist', async () => {
    mockFetchSuccess([]);

    render(<DayChecklist dayId={1} />);

    await waitFor(() => {
      expect(
        screen.getByText('No learn items yet. Add one below to get started.')
      ).toBeInTheDocument();
    });

    expect(screen.queryByText('% complete')).not.toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    mockFetchSuccess(allItems);

    render(<DayChecklist dayId={1} />);

    expect(screen.getByText('Loading checklist...')).toBeInTheDocument();
  });

  it('shows error toast on fetch failure', async () => {
    mockFetchFailure();

    render(<DayChecklist dayId={1} />);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Failed to load checklist items',
        'error'
      );
    });
  });
});

// --- FocusModeWidget Tests ---

describe('FocusModeWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders task items when they exist', async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ learn: mockLearnItems, build: mockBuildItems }),
    });

    render(
      <FocusModeWidget
        dayId={1}
        learnTask="Study design patterns"
        buildTask="Build auth module"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('focus-mode-widget')).toBeInTheDocument();
    });

    // Verify items are rendered
    expect(screen.getByText('Read chapter 5')).toBeInTheDocument();
    expect(screen.getByText('Watch video lecture')).toBeInTheDocument();
    expect(screen.getByText('Implement auth module')).toBeInTheDocument();
    expect(screen.getByText('Write unit tests')).toBeInTheDocument();
  });

  it('falls back to Learn/Build cards when no items exist', async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ learn: [], build: [] }),
    });

    render(
      <FocusModeWidget
        dayId={1}
        learnTask="Study design patterns"
        buildTask="Build auth module"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('focus-mode-fallback')).toBeInTheDocument();
    });

    // Verify fallback cards show task descriptions
    expect(screen.getByText('Study design patterns')).toBeInTheDocument();
    expect(screen.getByText('Build auth module')).toBeInTheDocument();
  });

  it('shows progress bar with correct percentage', async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ learn: mockLearnItems, build: mockBuildItems }),
    });

    render(
      <FocusModeWidget
        dayId={1}
        learnTask="Study design patterns"
        buildTask="Build auth module"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('focus-mode-widget')).toBeInTheDocument();
    });

    // 2 out of 4 items complete = 50%
    expect(screen.getByText('2/4 tasks done')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();

    // Verify progressbar role
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('shows loading state initially', () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ learn: [], build: [] }),
    });

    render(
      <FocusModeWidget
        dayId={1}
        learnTask="Study design patterns"
        buildTask="Build auth module"
      />
    );

    expect(screen.getByTestId('focus-mode-loading')).toBeInTheDocument();
  });

  it('falls back to cards on fetch failure', async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed' }),
    });

    render(
      <FocusModeWidget
        dayId={1}
        learnTask="Study design patterns"
        buildTask="Build auth module"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('focus-mode-fallback')).toBeInTheDocument();
    });
  });

  it('shows category labels when items exist', async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ learn: mockLearnItems, build: mockBuildItems }),
    });

    render(
      <FocusModeWidget
        dayId={1}
        learnTask="Study design patterns"
        buildTask="Build auth module"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('focus-mode-widget')).toBeInTheDocument();
    });

    // Category labels in the widget
    expect(screen.getByText(/Learn/)).toBeInTheDocument();
    expect(screen.getByText(/Build/)).toBeInTheDocument();
  });
});

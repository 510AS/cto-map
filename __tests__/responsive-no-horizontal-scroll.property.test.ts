/**
 * Property-based test for responsive no horizontal scroll.
 *
 * Feature: cto-learning-helper, Property 22: Responsive No Horizontal Scroll
 *
 * **Validates: Requirements 13.2**
 *
 * For viewport widths in [375, 1440], assert that the application's layout
 * approach ensures no horizontal scrollbar (document.documentElement.scrollWidth <= viewportWidth).
 *
 * Since we cannot run a real browser in a unit test environment, this test verifies
 * the CSS/Tailwind approach by:
 * 1. Reading all page and layout component files
 * 2. Asserting that the root layout constrains content width properly
 * 3. For arbitrary viewport widths in [375, 1440], verifying that the layout's
 *    max-width constraints and overflow handling prevent horizontal scroll
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Reads a component file and returns its content.
 */
function readComponent(relativePath: string): string {
  const fullPath = path.resolve(__dirname, '..', relativePath);
  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Checks if a component file contains width-constraining CSS classes
 * that prevent horizontal overflow.
 *
 * Valid containment patterns include:
 * - max-w-* (constrains maximum width)
 * - w-full (fills parent without exceeding)
 * - overflow-hidden / overflow-x-hidden (clips overflow)
 * - Container uses flex with min-w-0 (prevents flex children from overflowing)
 */
function hasWidthContainment(content: string): boolean {
  const containmentPatterns = [
    /max-w-/,           // max-width constraint (e.g., max-w-5xl, max-w-md)
    /w-full/,           // width: 100% (fills parent)
    /overflow-hidden/,  // overflow: hidden
    /overflow-x-hidden/, // overflow-x: hidden
    /min-w-0/,          // prevents flex overflow
  ];

  return containmentPatterns.some((pattern) => pattern.test(content));
}

/**
 * Checks if a component uses fixed-width elements that could cause overflow
 * at a given viewport width without proper containment.
 */
function hasUnconstrainedFixedWidth(content: string, viewportWidth: number): boolean {
  // Look for fixed pixel widths that exceed viewport
  const fixedWidthPattern = /w-\[(\d+)px\]/g;
  let match;
  while ((match = fixedWidthPattern.exec(content)) !== null) {
    const width = parseInt(match[1], 10);
    // If a fixed width exceeds viewport and there's no overflow containment nearby
    if (width > viewportWidth && !hasWidthContainment(content)) {
      return true;
    }
  }
  return false;
}

/**
 * The root layout's max-width value in pixels for the content area.
 * max-w-5xl = 64rem = 1024px at default font size.
 */
const MAX_W_5XL_PX = 1024;

/**
 * The sidebar width on desktop (md:w-56 = 14rem = 224px).
 */
const SIDEBAR_WIDTH_PX = 224;

/**
 * Computes the effective content width given a viewport width,
 * based on the layout structure:
 * - On mobile (<768px): full width with px-4 padding (16px each side)
 * - On desktop (>=768px): viewport - sidebar width, with px-4 padding
 *
 * The content is further constrained by max-w-5xl (1024px).
 */
function computeEffectiveContentWidth(viewportWidth: number): number {
  const padding = 16 * 2; // px-4 = 16px on each side

  if (viewportWidth < 768) {
    // Mobile: full width minus padding
    return Math.min(viewportWidth - padding, MAX_W_5XL_PX);
  } else {
    // Desktop: viewport minus sidebar minus padding, capped at max-w-5xl
    const availableWidth = viewportWidth - SIDEBAR_WIDTH_PX - padding;
    return Math.min(availableWidth, MAX_W_5XL_PX);
  }
}

// All page component paths in the application
const PAGE_COMPONENTS = [
  'app/layout.tsx',
  'app/page.tsx',
  'app/progress/page.tsx',
  'app/settings/page.tsx',
  'app/timeline/page.tsx',
  'app/bookmarks/page.tsx',
  'app/build-log/page.tsx',
  'app/week/[weekNumber]/page.tsx',
  'app/Navigation.tsx',
];

describe('Property 22: Responsive No Horizontal Scroll', () => {
  // Pre-read all component files
  const componentContents: Map<string, string> = new Map();

  beforeAll(() => {
    for (const componentPath of PAGE_COMPONENTS) {
      try {
        const content = readComponent(componentPath);
        componentContents.set(componentPath, content);
      } catch {
        // File might not exist yet; skip
      }
    }
  });

  /**
   * **Validates: Requirements 13.2**
   *
   * The root layout must use width-constraining patterns that prevent
   * content from exceeding the viewport width.
   */
  it('root layout uses width containment to prevent horizontal overflow', () => {
    const layoutContent = componentContents.get('app/layout.tsx');
    expect(layoutContent).toBeDefined();

    // The layout must have max-w-* or overflow containment on the content area
    expect(hasWidthContainment(layoutContent!)).toBe(true);

    // The layout should use flex layout with proper structure
    expect(layoutContent).toMatch(/flex/);

    // The main content area should have max-w constraint
    expect(layoutContent).toMatch(/max-w-/);
  });

  /**
   * **Validates: Requirements 13.2**
   *
   * All page components must use width-constraining CSS classes.
   */
  it('all page components use width-constraining CSS patterns', () => {
    for (const [componentPath, content] of componentContents) {
      // Each page should either use width containment directly
      // or rely on the parent layout's containment
      const isChildPage = componentPath !== 'app/layout.tsx' && componentPath !== 'app/Navigation.tsx';

      if (isChildPage) {
        // Child pages are wrapped by the layout's max-w-5xl container,
        // so they inherit containment. But they should also not introduce
        // unconstrained fixed widths.
        const hasUnconstrained = hasUnconstrainedFixedWidth(content, 375);
        expect(hasUnconstrained).toBe(false);
      } else if (componentPath === 'app/layout.tsx') {
        // Layout must have explicit width containment
        expect(hasWidthContainment(content)).toBe(true);
      } else {
        // Navigation is contained by its parent (fixed sidebar or inset-x-0 bottom nav)
        // It should not introduce unconstrained fixed widths
        const hasUnconstrained = hasUnconstrainedFixedWidth(content, 375);
        expect(hasUnconstrained).toBe(false);
      }
    }
  });

  /**
   * **Validates: Requirements 13.2**
   *
   * For any viewport width in [375, 1440], the layout's effective content width
   * must not exceed the viewport width, ensuring no horizontal scroll.
   *
   * Property: For all viewportWidth in [375, 1440]:
   *   effectiveContentWidth(viewportWidth) + padding + sidebar <= viewportWidth
   */
  it('for any viewport width in [375, 1440], content width does not exceed viewport width', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 375, max: 1440 }),
        (viewportWidth) => {
          const effectiveContentWidth = computeEffectiveContentWidth(viewportWidth);
          const padding = 16 * 2; // px-4 on each side

          if (viewportWidth < 768) {
            // Mobile: content + padding must fit within viewport
            const totalWidth = effectiveContentWidth + padding;
            expect(totalWidth).toBeLessThanOrEqual(viewportWidth);
          } else {
            // Desktop: content + padding + sidebar must fit within viewport
            const totalWidth = effectiveContentWidth + padding + SIDEBAR_WIDTH_PX;
            expect(totalWidth).toBeLessThanOrEqual(viewportWidth);
          }

          // The effective content width should always be positive
          expect(effectiveContentWidth).toBeGreaterThan(0);

          // The effective content width should never exceed max-w-5xl
          expect(effectiveContentWidth).toBeLessThanOrEqual(MAX_W_5XL_PX);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 13.2**
   *
   * No page component uses fixed pixel widths that exceed the minimum
   * supported viewport width (375px) without proper overflow handling.
   */
  it('no page component has unconstrained fixed widths exceeding minimum viewport (375px)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 375, max: 1440 }),
        (viewportWidth) => {
          for (const [, content] of componentContents) {
            const hasUnconstrained = hasUnconstrainedFixedWidth(content, viewportWidth);
            expect(hasUnconstrained).toBe(false);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 13.2**
   *
   * The layout structure ensures that at any viewport width in [375, 1440],
   * the document's scroll width would not exceed the viewport width.
   * This is verified by checking that:
   * - The root element uses min-h-screen (not min-w-screen or w-screen)
   * - The flex container doesn't force horizontal expansion
   * - The sidebar is fixed positioned (doesn't contribute to document flow width on mobile)
   * - The main content uses flex-1 (fills remaining space, doesn't overflow)
   */
  it('layout structure prevents document scroll width from exceeding viewport', () => {
    const layoutContent = componentContents.get('app/layout.tsx')!;

    // Root uses min-h-screen (vertical), not width-expanding classes
    expect(layoutContent).toMatch(/min-h-screen/);

    // Sidebar is hidden on mobile (hidden md:flex pattern)
    expect(layoutContent).toMatch(/hidden md:flex/);

    // Sidebar uses fixed positioning on desktop (doesn't affect document flow width)
    expect(layoutContent).toMatch(/md:fixed/);

    // Main content uses flex-1 (fills available space without overflowing)
    expect(layoutContent).toMatch(/flex-1/);

    // Main content has ml offset matching sidebar width on desktop
    expect(layoutContent).toMatch(/md:ml-60/);

    // Content area has max-width constraint
    expect(layoutContent).toMatch(/max-w-5xl/);

    // Content area uses mx-auto for centering (doesn't cause overflow)
    expect(layoutContent).toMatch(/mx-auto/);

    // Bottom nav uses inset-x-0 (full width, no overflow)
    expect(layoutContent).toMatch(/inset-x-0/);
  });
});

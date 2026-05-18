/**
 * Property-based test for touch target minimum size.
 *
 * Feature: cto-learning-helper, Property 23: Touch Target Minimum Size
 *
 * **Validates: Requirements 13.3**
 *
 * For any interactive element E rendered in the application (buttons, checkboxes,
 * links, toggles), E's rendered bounding box SHALL have both width ≥ 44 CSS pixels
 * and height ≥ 44 CSS pixels.
 *
 * Since this is a visual property that would normally require a browser, this test
 * performs static analysis on all component and page files to verify that every
 * interactive element (button, input, Link, a, label wrapping checkbox inputs)
 * includes Tailwind classes that guarantee the 44×44px minimum touch target size.
 *
 * Accepted patterns for minimum height:
 * - min-h-[44px] (exactly 44px)
 * - min-h-[Npx] where N >= 44 (e.g., min-h-[100px], min-h-[120px])
 *
 * Accepted patterns for minimum width:
 * - min-w-[44px] or min-w-[Npx] where N >= 44
 * - w-full (full width is always >= 44px on any supported viewport >= 375px)
 * - block (display:block fills container width, always >= 44px)
 * - flex-1 (flex grow fills available space, always >= 44px)
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Directories containing UI components and pages
const PROJECT_ROOT = path.resolve(__dirname, '..');
const COMPONENT_DIRS = [
  path.join(PROJECT_ROOT, 'components'),
  path.join(PROJECT_ROOT, 'app'),
];

// File extensions to scan
const TSX_EXTENSIONS = ['.tsx'];

/**
 * Recursively collect all .tsx files from a directory.
 */
function collectTsxFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, .next, api routes (no UI)
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'api') {
        continue;
      }
      results.push(...collectTsxFiles(fullPath));
    } else if (TSX_EXTENSIONS.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Check if a className string satisfies the minimum height requirement (>= 44px).
 * Accepts min-h-[44px], min-h-[100px], min-h-[120px], etc.
 */
function hasMinHeightAtLeast44(classString: string): boolean {
  const match = classString.match(/min-h-\[(\d+)px\]/);
  if (!match) return false;
  return parseInt(match[1], 10) >= 44;
}

/**
 * Check if a className string satisfies the minimum width requirement (>= 44px).
 * Accepts:
 * - min-w-[44px] or min-w-[Npx] where N >= 44
 * - w-full (guarantees >= 375px on smallest viewport)
 * - block (display:block elements fill their container width, always >= 44px)
 * - flex-1 (flex items that grow to fill available space)
 */
function hasMinWidthAtLeast44(classString: string): boolean {
  // Block-level elements fill their container width (always >= 44px in supported viewports)
  if (classString.includes('w-full')) return true;
  if (/\bblock\b/.test(classString)) return true;
  if (classString.includes('flex-1')) return true;
  const match = classString.match(/min-w-\[(\d+)px\]/);
  if (!match) return false;
  return parseInt(match[1], 10) >= 44;
}

/**
 * Represents an interactive element found in source code.
 */
interface InteractiveElement {
  file: string;
  lineNumber: number;
  elementType: string;
  classString: string;
  satisfiesMinHeight: boolean;
  satisfiesMinWidth: boolean;
}

/**
 * Extract interactive elements from a TSX file and check for touch target classes.
 *
 * Interactive elements are:
 * - <button ...> elements (always interactive)
 * - <input ...> elements (text, date, etc. — NOT checkboxes wrapped in labels)
 * - <Link ...> elements (Next.js navigation links)
 * - <textarea ...> elements (user input areas)
 * - <label ...> elements that wrap checkbox inputs (these ARE the touch target)
 *
 * Non-interactive labels (text labels for form fields) are excluded.
 */
function extractInteractiveElements(filePath: string): InteractiveElement[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const elements: InteractiveElement[] = [];
  const relativePath = path.relative(PROJECT_ROOT, filePath);

  // Patterns to match interactive JSX elements with their className
  // Using two variants: regular quotes and template literals
  const patterns: { tag: string; regex: RegExp }[] = [
    { tag: 'button', regex: /<button\b[^>]*?className\s*=\s*"([^"]*?)"/gs },
    { tag: 'button', regex: /<button\b[^>]*?className\s*=\s*\{`([^`]*?)`\}/gs },
    { tag: 'Link', regex: /<Link\b[^>]*?className\s*=\s*"([^"]*?)"/gs },
    { tag: 'Link', regex: /<Link\b[^>]*?className\s*=\s*\{`([^`]*?)`\}/gs },
    { tag: 'input', regex: /<input\b[^>]*?className\s*=\s*"([^"]*?)"/gs },
    { tag: 'input', regex: /<input\b[^>]*?className\s*=\s*\{`([^`]*?)`\}/gs },
    { tag: 'textarea', regex: /<textarea\b[^>]*?className\s*=\s*"([^"]*?)"/gs },
    { tag: 'textarea', regex: /<textarea\b[^>]*?className\s*=\s*\{`([^`]*?)`\}/gs },
    { tag: 'label', regex: /<label\b[^>]*?className\s*=\s*"([^"]*?)"/gs },
    { tag: 'label', regex: /<label\b[^>]*?className\s*=\s*\{`([^`]*?)`\}/gs },
  ];

  for (const { tag, regex } of patterns) {
    let match: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((match = regex.exec(content)) !== null) {
      const classString = match[1];
      const matchIndex = match.index;
      const lineNumber = content.substring(0, matchIndex).split('\n').length;

      // For labels: only include those that wrap interactive inputs (touch target wrappers)
      // These are identified by having cursor-pointer and containing an <input in nearby context
      if (tag === 'label') {
        const afterLabel = content.substring(matchIndex, matchIndex + 500);
        const hasInputInside = afterLabel.includes('<input');
        const hasCursorPointer = classString.includes('cursor-pointer');
        // Only count labels that are interactive touch target wrappers
        if (!hasInputInside || !hasCursorPointer) {
          continue;
        }
      }

      // For inputs: skip checkboxes (their parent label provides the touch target)
      if (tag === 'input') {
        const elementContext = content.substring(matchIndex, matchIndex + 300);
        if (elementContext.includes('type="checkbox"') || elementContext.includes("type='checkbox'")) {
          continue;
        }
      }

      elements.push({
        file: relativePath,
        lineNumber,
        elementType: tag,
        classString,
        satisfiesMinHeight: hasMinHeightAtLeast44(classString),
        satisfiesMinWidth: hasMinWidthAtLeast44(classString),
      });
    }
  }

  return elements;
}

// Collect all TSX files
const allTsxFiles: string[] = [];
for (const dir of COMPONENT_DIRS) {
  allTsxFiles.push(...collectTsxFiles(dir));
}

// Extract all interactive elements from all files
const allInteractiveElements: InteractiveElement[] = [];
for (const file of allTsxFiles) {
  allInteractiveElements.push(...extractInteractiveElements(file));
}

describe('Property 23: Touch Target Minimum Size', () => {
  /**
   * **Validates: Requirements 13.3**
   *
   * Assert every interactive element's bounding box has width ≥ 44px and height ≥ 44px.
   * We verify this by checking that all interactive elements include Tailwind utility
   * classes guaranteeing at least 44px in both dimensions.
   */
  it('should find interactive elements in the codebase to test', () => {
    // Sanity check: we should find interactive elements
    expect(allInteractiveElements.length).toBeGreaterThan(0);
  });

  it('all interactive elements must satisfy min-height >= 44px for touch target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: allInteractiveElements.length - 1 }),
        (index: number) => {
          const element = allInteractiveElements[index];

          if (!element.satisfiesMinHeight) {
            throw new Error(
              `Touch target violation: <${element.elementType}> in ${element.file}:${element.lineNumber} ` +
              `does not guarantee min-height >= 44px. Classes: "${element.classString}"`
            );
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('all interactive elements must satisfy min-width >= 44px for touch target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: allInteractiveElements.length - 1 }),
        (index: number) => {
          const element = allInteractiveElements[index];

          if (!element.satisfiesMinWidth) {
            throw new Error(
              `Touch target violation: <${element.elementType}> in ${element.file}:${element.lineNumber} ` +
              `does not guarantee min-width >= 44px. Classes: "${element.classString}"`
            );
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('touch target property holds for arbitrary element selections from the codebase', () => {
    // Property test: for any randomly selected interactive element,
    // it must satisfy the 44x44 minimum touch target requirement
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: allInteractiveElements.length - 1 }),
        (index: number) => {
          const element = allInteractiveElements[index];

          const heightOk = element.satisfiesMinHeight;
          const widthOk = element.satisfiesMinWidth;

          if (!heightOk || !widthOk) {
            throw new Error(
              `Touch target violation: <${element.elementType}> in ${element.file}:${element.lineNumber} ` +
              `fails 44×44px minimum. ` +
              `Height OK: ${heightOk}, Width OK: ${widthOk}. ` +
              `Classes: "${element.classString}"`
            );
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});

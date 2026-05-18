import * as fs from 'fs';
import * as vm from 'vm';
import { ParsedPhase, ParsedWeek, ParsedDay } from './types';

/**
 * Raw shape of a day object in the HTML data array.
 */
interface RawDay {
  d: string;
  l: string;
  b: string;
}

/**
 * Raw shape of a week (item) object in the HTML data array.
 */
interface RawItem {
  n: number;
  title: string;
  tags: string[];
  days: RawDay[];
  goal: string;
  saas: string;
}

/**
 * Raw shape of a phase object in the HTML data array.
 */
interface RawPhase {
  phase: string;
  badge: string;
  badgeClass: string;
  cardClass: string;
  desc: string;
  items: RawItem[];
}

/**
 * Reads the HTML file at `filePath`, extracts the `const data=[...]` JS array
 * using a regex, evaluates it in a sandboxed context, and returns structured data.
 *
 * Throws a descriptive error if the file is not found or the array cannot be parsed.
 */
export function parseHtmlDataFile(filePath: string): ParsedPhase[] {
  // Read the HTML file
  let htmlContent: string;
  try {
    htmlContent = fs.readFileSync(filePath, 'utf-8');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Error: HTML file not found at ${filePath}. Please check the configured path. (${message})`
    );
  }

  // Extract the data=[...] array literal from the <script> block
  const dataRegex = /\bdata\s*=\s*(\[[\s\S]*?\n\]);/;
  const match = htmlContent.match(dataRegex);

  if (!match || !match[1]) {
    throw new Error(
      `Error: Could not parse data array from HTML file. Ensure the file is unmodified.`
    );
  }

  const arrayLiteral = match[1];

  // Evaluate the array literal in a sandboxed context
  let rawData: RawPhase[];
  try {
    const sandbox = {};
    rawData = vm.runInNewContext(`(${arrayLiteral})`, sandbox) as RawPhase[];
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Error: Could not parse data array from HTML file. Ensure the file is unmodified. (${message})`
    );
  }

  if (!Array.isArray(rawData) || rawData.length === 0) {
    throw new Error(
      `Error: Could not parse data array from HTML file. Ensure the file is unmodified.`
    );
  }

  // Transform raw data into ParsedPhase[] format
  const phases: ParsedPhase[] = rawData.map(
    (rawPhase: RawPhase, phaseIndex: number): ParsedPhase => {
      const weeks: ParsedWeek[] = rawPhase.items.map(
        (item: RawItem): ParsedWeek => {
          const days: ParsedDay[] = item.days.map(
            (day: RawDay, dayIndex: number): ParsedDay => ({
              dayLabel: day.d,
              learnTask: day.l,
              buildTask: day.b,
              sortOrder: dayIndex + 1,
            })
          );

          return {
            weekNumber: item.n,
            title: item.title,
            tags: item.tags,
            days,
            goal: item.goal,
            saasEvolution: item.saas,
          };
        }
      );

      return {
        name: rawPhase.phase,
        badge: rawPhase.badge,
        sortOrder: phaseIndex + 1,
        weeks,
      };
    }
  );

  return phases;
}

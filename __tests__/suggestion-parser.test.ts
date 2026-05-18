import { parseSuggestions } from '../lib/suggestion-parser';

describe('parseSuggestions', () => {
  describe('comma splitting', () => {
    it('splits on commas', () => {
      const result = parseSuggestions('Read chapter 1, Take notes, Review exercises', 'learn');
      expect(result).toEqual([
        { title: 'Read chapter 1', category: 'learn', source: 'template' },
        { title: 'Take notes', category: 'learn', source: 'template' },
        { title: 'Review exercises', category: 'learn', source: 'template' },
      ]);
    });
  });

  describe('semicolon splitting', () => {
    it('splits on semicolons', () => {
      const result = parseSuggestions('Setup project; Write tests; Deploy', 'build');
      expect(result).toEqual([
        { title: 'Setup project', category: 'build', source: 'template' },
        { title: 'Write tests', category: 'build', source: 'template' },
        { title: 'Deploy', category: 'build', source: 'template' },
      ]);
    });
  });

  describe('"and" conjunction splitting', () => {
    it('splits on " and " conjunctions', () => {
      const result = parseSuggestions('Read docs and write summary and practice', 'learn');
      expect(result).toEqual([
        { title: 'Read docs', category: 'learn', source: 'template' },
        { title: 'write summary', category: 'learn', source: 'template' },
        { title: 'practice', category: 'learn', source: 'template' },
      ]);
    });

    it('does not split on "and" within words', () => {
      const result = parseSuggestions('Understand the fundamentals', 'learn');
      expect(result).toEqual([
        { title: 'Understand the fundamentals', category: 'learn', source: 'template' },
      ]);
    });
  });

  describe('numbered list splitting', () => {
    it('splits on numbered list patterns', () => {
      const result = parseSuggestions('1. Read chapter 2. Take notes 3. Review', 'learn');
      expect(result).toEqual([
        { title: 'Read chapter', category: 'learn', source: 'template' },
        { title: 'Take notes', category: 'learn', source: 'template' },
        { title: 'Review', category: 'learn', source: 'template' },
      ]);
    });

    it('handles multi-digit numbers', () => {
      const result = parseSuggestions('10. First item 11. Second item', 'build');
      expect(result).toEqual([
        { title: 'First item', category: 'build', source: 'template' },
        { title: 'Second item', category: 'build', source: 'template' },
      ]);
    });
  });

  describe('mixed delimiters', () => {
    it('splits on semicolons and commas together', () => {
      const result = parseSuggestions('Read chapter; Take notes, Review exercises', 'learn');
      expect(result).toEqual([
        { title: 'Read chapter', category: 'learn', source: 'template' },
        { title: 'Take notes', category: 'learn', source: 'template' },
        { title: 'Review exercises', category: 'learn', source: 'template' },
      ]);
    });

    it('splits on semicolons, commas, and "and" conjunctions', () => {
      const result = parseSuggestions('Read; Write, Edit and Publish', 'build');
      expect(result).toEqual([
        { title: 'Read', category: 'build', source: 'template' },
        { title: 'Write', category: 'build', source: 'template' },
        { title: 'Edit', category: 'build', source: 'template' },
        { title: 'Publish', category: 'build', source: 'template' },
      ]);
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty string', () => {
      expect(parseSuggestions('', 'learn')).toEqual([]);
    });

    it('returns empty array for whitespace-only string', () => {
      expect(parseSuggestions('   ', 'learn')).toEqual([]);
    });

    it('filters out empty segments from consecutive delimiters', () => {
      const result = parseSuggestions('Read,,Write', 'learn');
      expect(result).toEqual([
        { title: 'Read', category: 'learn', source: 'template' },
        { title: 'Write', category: 'learn', source: 'template' },
      ]);
    });

    it('trims whitespace from segments', () => {
      const result = parseSuggestions('  Read  ,  Write  ', 'build');
      expect(result).toEqual([
        { title: 'Read', category: 'build', source: 'template' },
        { title: 'Write', category: 'build', source: 'template' },
      ]);
    });

    it('returns single item when no delimiters present', () => {
      const result = parseSuggestions('Read the documentation', 'learn');
      expect(result).toEqual([
        { title: 'Read the documentation', category: 'learn', source: 'template' },
      ]);
    });

    it('all suggestions have source = template', () => {
      const result = parseSuggestions('A, B, C', 'build');
      result.forEach((suggestion) => {
        expect(suggestion.source).toBe('template');
      });
    });

    it('uses the provided category for all suggestions', () => {
      const learnResult = parseSuggestions('A, B', 'learn');
      learnResult.forEach((s) => expect(s.category).toBe('learn'));

      const buildResult = parseSuggestions('A, B', 'build');
      buildResult.forEach((s) => expect(s.category).toBe('build'));
    });
  });
});

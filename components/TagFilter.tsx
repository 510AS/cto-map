'use client';

import { TagFilterProps } from '@/lib/types';

/**
 * TagFilter renders tag pills with multi-select support.
 * Enhanced with better visual feedback and compact design.
 */
export default function TagFilter({ tags, selectedTagIds, onSelectionChange }: TagFilterProps) {
  const handleTagToggle = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onSelectionChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onSelectionChange([...selectedTagIds, tagId]);
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => {
        const isSelected = selectedTagIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => handleTagToggle(tag.id)}
            className={`min-h-[36px] px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
              isSelected
                ? 'bg-blue-600 text-white shadow-sm scale-105'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
            aria-pressed={isSelected}
            aria-label={`Filter by ${tag.name}`}
          >
            {tag.name}
          </button>
        );
      })}
      {selectedTagIds.length > 0 && (
        <button
          type="button"
          onClick={handleClearAll}
          className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-full text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          aria-label="Clear all tag filters"
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}

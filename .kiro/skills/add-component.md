# Skill: Add Component

## When to Use
When you need to create a new React component for the CTO Map project.

## Steps

1. Create file at `components/[ComponentName].tsx` (PascalCase)
2. Add `'use client';` if it uses hooks, state, effects, or event handlers
3. Define props interface
4. Implement with Tailwind CSS + dark mode classes
5. Ensure all interactive elements have `min-h-[44px] min-w-[44px]`

## Template (Client Component)

```typescript
'use client';

import { useState } from 'react';
import { useToast } from '@/lib/toast-context';

interface MyComponentProps {
  title: string;
  onAction: (value: string) => void;
}

export default function MyComponent({ title, onAction }: MyComponentProps) {
  const [value, setValue] = useState('');
  const { showToast } = useToast();

  return (
    <div className="card p-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {title}
      </h2>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full min-h-[44px] px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:placeholder:text-gray-500 transition-colors"
        placeholder="Enter value..."
      />
      <button
        onClick={() => { onAction(value); showToast('Done!', 'success'); }}
        className="min-h-[44px] min-w-[44px] px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        Submit
      </button>
    </div>
  );
}
```

## Dark Mode Checklist
- `text-gray-900` → add `dark:text-gray-100`
- `text-gray-700` → add `dark:text-gray-300`
- `text-gray-500` → add `dark:text-gray-400`
- `bg-white` → add `dark:bg-gray-900`
- `bg-gray-50` → add `dark:bg-gray-800`
- `border-gray-200` → add `dark:border-gray-700`
- `hover:bg-gray-50` → add `dark:hover:bg-gray-800`

## Available CSS Classes (from globals.css)
- `.card` — white card with border, shadow, dark mode
- `.stat-card` — compact stat display card
- `.badge` / `.badge-blue` / `.badge-green` / `.badge-orange` — pill badges
- `.skeleton` — loading placeholder with pulse animation
- `.animate-fade-in` — fade in on mount

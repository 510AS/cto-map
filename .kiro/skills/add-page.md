# Skill: Add Page

## When to Use
When you need to create a new page/route in the CTO Map project.

## Steps

1. Create directory: `app/[route-name]/`
2. Create file: `app/[route-name]/page.tsx`
3. Add `'use client';` for interactive pages
4. Add loading skeleton state
5. Add error state with retry
6. Add to Navigation.tsx if it's a main page
7. Support dark mode throughout

## Template (Client Page)

```typescript
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PageData {
  // define your data shape
}

export default function MyPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/my-endpoint');
        if (!res.ok) throw new Error('Failed to load');
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-32 w-full rounded-xl" />
        <div className="skeleton h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Page Title</h1>
      {/* Content */}
    </div>
  );
}
```

## Template (Server Page)

```typescript
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  const data = await prisma.model.findMany();

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Page Title</h1>
      {/* Render data */}
    </div>
  );
}
```

## Adding to Navigation
Edit `app/Navigation.tsx` and add to the `navItems` array or the "More" section:
```typescript
{
  label: "My Page",
  href: "/my-page",
  icon: ( <svg className="w-5 h-5" ...> ... </svg> ),
}
```

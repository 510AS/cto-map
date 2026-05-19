---
inclusion: auto
---

# Coding Standards

## TypeScript
- Strict mode enabled
- Use interfaces (not types) for object shapes
- Export interfaces from `lib/types.ts` for shared types
- Use `as const` for literal arrays
- Avoid `any` — use proper typing or `unknown` with type guards

## React Components
- Functional components only (no class components except ErrorBoundary)
- Client components: add `'use client';` at the top
- Server components: no directive needed (default in App Router)
- Props interfaces defined inline or in `lib/types.ts`
- Use `useCallback` for functions passed as props
- Use `useRef` for callback refs to avoid infinite loops in useEffect deps

## Styling (Tailwind CSS)
- **ALWAYS add dark mode variants**: every `text-gray-900` needs `dark:text-gray-100`, every `bg-white` needs `dark:bg-gray-900`, etc.
- **Touch targets**: all interactive elements must have `min-h-[44px] min-w-[44px]`
- Use the component classes from `globals.css`: `.card`, `.stat-card`, `.badge`, `.badge-blue`, `.badge-green`, `.badge-orange`, `.skeleton`
- Animations: `.animate-fade-in`, `.animate-slide-up`, `.animate-bounce-in`
- Responsive: mobile-first, use `sm:` and `md:` breakpoints

## API Routes
- Located in `app/api/[endpoint]/route.ts`
- Always return `NextResponse.json()`
- Always wrap in try/catch with 500 fallback
- Validate inputs (use Zod schemas from `lib/validators.ts` when possible)
- After modifying Day completion, always check if Week should auto-complete
- After modifying TaskItems, always run `calculateDayCompletion()` and update the Day

## State Management
- **ProgressContext** (`lib/progress-context.tsx`): tracks completed days/weeks globally, has 30-second cache
- **ToastContext** (`lib/toast-context.tsx`): `showToast(message, 'success'|'error'|'info')`
- **ThemeContext** (`lib/theme-context.tsx`): `useTheme()` returns `{ theme, resolvedTheme, setTheme }`
- Call `refreshProgress()` after user actions that change completion state

## File Organization
- Pages: `app/[route]/page.tsx`
- API routes: `app/api/[endpoint]/route.ts`
- Components: `components/[Name].tsx` (PascalCase)
- Utilities: `lib/[name].ts` (camelCase)
- Tests: `__tests__/[name].test.ts`

## Common Patterns
```typescript
// Toast notification
const { showToast } = useToast();
showToast("Saved!", "success");

// Progress update
const { refreshProgress, markDayComplete } = useProgress();
markDayComplete(dayId, weekId, isComplete, weekIsComplete);

// API call with optimistic update
setItems(optimisticValue);
try {
  const res = await fetch('/api/...', { method: 'PATCH', ... });
  if (!res.ok) throw new Error();
} catch {
  setItems(previousValue); // rollback
  showToast("Failed", "error");
}
```

# Skill: Modify Database Schema

## When to Use
When you need to add fields, models, or relations to the Prisma schema.

## Steps

1. Edit `prisma/schema.prisma`
2. Add new fields/models
3. Run migration: `npx prisma db push` (dev) or `npx prisma migrate dev --name description`
4. Update `lib/types.ts` with corresponding TypeScript interfaces
5. Update relevant API routes to handle new fields
6. Update components to display/edit new fields

## Adding a Field to Existing Model

```prisma
model Day {
  // ... existing fields ...
  newField    String?   // nullable, optional
  newRequired String    @default("")  // required with default
  newNumber   Int?      // nullable number
  newBool     Boolean   @default(false)
}
```

## Adding a New Model

```prisma
model NewModel {
  id        Int      @id @default(autoincrement())
  name      String
  weekId    Int
  week      Week     @relation(fields: [weekId], references: [id])
  createdAt DateTime @default(now())

  @@index([weekId])
}
```

Don't forget to add the reverse relation to the parent model:
```prisma
model Week {
  // ... existing fields ...
  newModels NewModel[]
}
```

## After Schema Changes

```bash
# Stop the dev server first (Windows locks the Prisma DLL)
# Then:
npx prisma db push          # Quick sync (may lose data in dev)
# OR
npx prisma migrate dev --name add_new_field  # Creates migration file

# If you get EPERM errors:
# 1. Stop the Next.js dev server
# 2. Run the command again
# 3. Restart the dev server
```

## Update TypeScript Types

Add to `lib/types.ts`:
```typescript
export interface NewModel {
  id: number;
  name: string;
  weekId: number;
  createdAt: string;
}
```

## Important
- SQLite doesn't support `@default(now())` on non-DateTime fields
- SQLite doesn't support enums — use String with validation
- After adding fields to Day/TaskItem, update the completion calculator if relevant
- After adding relations to Week, update the `/api/weeks` and `/api/weeks/[weekId]` includes

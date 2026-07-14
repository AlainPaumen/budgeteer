# Categories Feature Design

**Date:** 2026-07-14  
**Author:** opencode-agent  
**Status:** Approved

## Overview

Add a new "Categories" CRUD feature to the budgeteer app, following the same pattern as the Suppliers feature.

## Requirements

- **Entity:** Category
- **Fields:** name (required, unique), notes (optional), isActive, tracking fields
- **Icon:** FoldersIcon from lucide-react
- **Navigation:** Add to sidebar

## Schema

```typescript
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  notes: text("notes"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdBy: text("created_by").notNull().references(() => user.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedBy: text("updated_by").notNull().references(() => user.id),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$onUpdate(() => new Date()).notNull(),
});
```

## API Endpoints

- `GET /api/categories` - List with pagination, search, sort, filter by isActive
- `POST /api/categories` - Create new category
- `PATCH /api/categories/:id` - Update category (including is_active for undelete)
- `DELETE /api/categories/:id` - Soft delete (set isActive = false)

## Frontend Components

- `_authenticated.categories.tsx` - List page with table, search, pagination, sort, show inactive filter
- `category-form-dialog.tsx` - Create/edit form using TanStack Form with Zod validation
- `delete-category-dialog.tsx` - Delete/undelete confirmation dialog

## Sidebar

Add Categories to sidebar with FoldersIcon, positioned after Services.

## Implementation Steps

1. Add schema to `apps/api/src/db/schema.ts`
2. Create migration `apps/api/src/db/migrations/0007_add_categories.sql`
3. Create API route `apps/api/src/routes/categories.ts`
4. Mount route in `apps/api/src/index.ts`
5. Create frontend route `apps/web/src/routes/_authenticated.categories.tsx`
6. Create form dialog `apps/web/src/components/category-form-dialog.tsx`
7. Create delete dialog `apps/web/src/components/delete-category-dialog.tsx`
8. Update sidebar `apps/web/src/components/app-sidebar.tsx`
9. Create database table
10. Test and commit

# Suppliers Feature Design

## Overview

CRUD management for suppliers — companies the user pays bills to. Each supplier has a name, optional notes, and an active flag. Scoped per user.

## Backend

### Schema (`apps/api/src/db/schema.ts`)

New `supplier` table:
- `id` (text, primary key)
- `name` (text, not null)
- `notes` (text, nullable)
- `isActive` (integer/boolean, default true)
- `userId` (text, foreign key → user, cascade delete)
- `createdAt`, `updatedAt` (timestamps)

Relations: supplier belongs to user.

### API Routes (`apps/api/src/index.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/suppliers` | List all suppliers for current user |
| POST | `/api/suppliers` | Create a supplier |
| PUT | `/api/suppliers/:id` | Update a supplier |
| DELETE | `/api/suppliers/:id` | Delete a supplier |

All routes require authentication (session-based via Better Auth).

## Frontend

### Route

`/suppliers` — requires auth, shows table of suppliers.

### Components

**`/suppliers` route:**
- TanStack Table with columns: Name, Notes, Active, Actions
- Search filter on name
- "Add Supplier" button opens create dialog
- Row actions: Edit, Delete (with confirmation)

**`supplier-form.tsx`:**
- Dialog containing a TanStack Form
- Fields: name (required), notes (optional), isActive (checkbox, default true)
- Reused for both create and edit

### Data Fetching

- `@tanstack/react-query` with `eden` client
- Query key: `["suppliers"]`

### Dependencies

- Install `@tanstack/react-table`

## Files

| File | Action |
|------|--------|
| `apps/api/src/db/schema.ts` | Add `supplier` table + relations |
| `apps/api/src/index.ts` | Add CRUD routes |
| `apps/web/package.json` | Install `@tanstack/react-table` |
| `apps/web/src/routes/suppliers.tsx` | Create `/suppliers` page |
| `apps/web/src/components/supplier-form.tsx` | Create/edit dialog |

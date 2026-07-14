# Categories Feature Design

## Overview

Add a Categories CRUD feature mirroring the existing Suppliers pattern, with two additional boolean fields: `isFixed` and `isCapex`.

## Schema

Table: `categories`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | integer | PK, auto-increment | — |
| name | text | NOT NULL, UNIQUE | — |
| notes | text | nullable | NULL |
| isFixed | integer (boolean) | NOT NULL | true |
| isCapex | integer (boolean) | NOT NULL | false |
| isActive | integer (boolean) | NOT NULL | true |
| createdBy | text | NOT NULL, FK → user.id | — |
| createdAt | integer (timestamp_ms) | NOT NULL | — |
| updatedBy | text | NOT NULL, FK → user.id | — |
| updatedAt | integer (timestamp_ms) | NOT NULL | — |

## API Endpoints

Base path: `/api/categories`

### GET /
List categories with pagination.

**Query params:** page, limit, search, is_active, sort (name), order (asc/desc)

**Response:**
```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
}
```

### POST /
Create a category.

**Body:** `{ name: string, notes?: string | null, isFixed?: boolean, isCapex?: boolean }`

**Validations:** name required, 1–255 chars; notes max 1000 chars, nullable; isFixed/isCapex optional booleans.

**Uniqueness:** Duplicate active name → 409.

### PATCH /:id
Update a category. Works on both active and inactive items (enables undelete).

**Body:** `{ name?: string, notes?: string | null, isFixed?: boolean, isCapex?: boolean, is_active?: boolean }`

**Validations:** Same as POST, all fields optional.

### DELETE /:id
Soft delete — sets `isActive = false`. Only works on active items.

## Frontend

### Route
`/categories` — `_authenticated.categories.tsx`

### Table Columns
| Column | Notes |
|--------|-------|
| Name | Sortable (default asc) |
| Notes | Truncated, "—" if empty |
| Fixed | Badge: "Fixed" or "Variable" |
| Capex | Badge: "Capex" or "Opex" |
| Actions | Edit (pencil) + Delete/Undelete icon |

### Form Dialog
Fields:
- Name (text input, required)
- Notes (textarea, optional)
- Is Fixed (checkbox, default checked)
- Is Capex (checkbox, default unchecked)

### Filters
- Search box (searches name)
- "Show inactive" checkbox (right-aligned)
- Sort toggle on Name column

### Sidebar
- Icon: `FolderTree` from lucide-react
- Link: `/categories`
- Label: "Categories"

## Pattern Reference
Mirrors `apps/web/src/routes/_authenticated.suppliers.tsx` and related components exactly.

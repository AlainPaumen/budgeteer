# Expense Pivot Table — Implementation Plan

## Goal

Build a monthly expense pivot table that groups invoice line data by **Service → Category**, with 12 month columns for the selected year. Amounts are pro-rated across months using rolling 30-day periods.

---

## Decisions Summary

| Decision | Choice |
|----------|--------|
| Date basis | `start_date` / `end_date` on invoice lines |
| Pro-rating | Equal split across months (rolling 30-day). Same date → full amount to that month |
| Columns | 12 months of the selected year |
| Row grouping | Service (collapsible header with subtotal) → Category (indented row) |
| Grand total | Row at top, above service groups |
| Empty cells | Dash "–" |
| Sorting | Alphabetical by service name, then category name |
| Year picker | Prev/next arrows, default current year |
| Filters | Single-select dropdowns: branch, supplier, cost type (all clearable) |
| URL state | Year + filters in search params for bookmarkability |
| Collapse state | Persisted in localStorage |
| Empty state | "No expenses found" centered message |
| Export | CSV |
| Currency | EUR (€1,234.56) |
| Inactive records | Excluded |

---

## Files to Create/Modify

### Backend

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/routes/reports.ts` | **Create** | New route module for report endpoints |
| `apps/api/src/index.ts` | **Modify** | Register `reportRoutes` |

### Frontend

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/components/app-sidebar.tsx` | **Modify** | Add "Reports" sidebar group with "Expenses" link |
| `apps/web/src/routes/_authenticated.reports.expenses.tsx` | **Create** | Main expenses pivot page |
| `apps/web/src/components/expense-pivot-table.tsx` | **Create** | Pivot table component with collapsible rows |
| `apps/web/src/components/year-picker.tsx` | **Create** | Year picker with prev/next arrows |
| `apps/web/src/lib/utils.ts` | **Modify** | Add `formatCurrency` helper |

---

## Step-by-Step Implementation

### Step 1: Backend — Expense Pivot API Endpoint

**File: `apps/api/src/routes/reports.ts`**

Create a `GET /api/reports/expenses` endpoint with query params:
- `year` (required, integer) — the year to report on
- `branch_id` (optional, integer) — filter by branch
- `supplier_id` (optional, integer) — filter by supplier
- `cost_type_id` (optional, integer) — filter by cost type

**Response shape:**
```json
{
  "year": 2026,
  "services": [
    {
      "serviceId": 1,
      "serviceName": "Web Hosting",
      "months": [120.00, 120.00, ...],
      "total": 1440.00,
      "categories": [
        {
          "categoryId": 10,
          "categoryName": "Infrastructure",
          "months": [50.00, 50.00, ...],
          "total": 600.00
        }
      ]
    }
  ],
  "grandTotal": [320.00, 320.00, ...],
  "grandTotalSum": 3840.00
}
```

**Pro-rating logic (server-side):**

For each invoice line:
1. If `start_date` and `end_date` are the same calendar day → assign full `total_amount` to that month
2. Otherwise → `monthly_amount = total_amount / total_months_spanned` using rolling 30-day months
3. Clip to the selected year (only count months within Jan–Dec)

**Key implementation details:**
- Drizzle queries joining `invoice_lines` → `services`, `categories`, `invoices`
- Filter by `is_active = true` on services, categories, cost_types
- Filter invoice date range overlap with target year
- Amounts returned in EUR (divide by 10000)
- Auth-protected via `getSessionUserId`

### Step 2: Backend — Register Route

**File: `apps/api/src/index.ts`**

- Import `reportRoutes` from `./routes/reports`
- Add `.use(reportRoutes)` to the Elysia app chain

### Step 3: Frontend — Utility Helper

**File: `apps/web/src/lib/utils.ts`**

Add `formatCurrency` function using `Intl.NumberFormat` with EUR.

### Step 4: Frontend — Year Picker Component

**File: `apps/web/src/components/year-picker.tsx`**

Props: `value: number`, `onChange: (year: number) => void`. Left/right chevron arrows.

### Step 5: Frontend — Sidebar Update

**File: `apps/web/src/components/app-sidebar.tsx`**

Add "Reports" group with "Expenses" link to `/reports/expenses`.

### Step 6: Frontend — Expense Pivot Table Component

**File: `apps/web/src/components/expense-pivot-table.tsx`**

Main UI: table with 14 columns (Label + 12 months + Total). Service rows collapsible with bold+muted style. Category rows indented. Grand total at top. Horizontal scrollable.

### Step 7: Frontend — Expense Reports Page

**File: `apps/web/src/routes/_authenticated.reports.expenses.tsx`**

Route with TanStack Router search params. TanStack Query for data. Filter dropdowns from existing endpoints. CSV export. Loading/empty states.

---

## Implementation Order

1. `apps/api/src/routes/reports.ts` — API endpoint
2. `apps/api/src/index.ts` — Register route
3. `apps/web/src/lib/utils.ts` — formatCurrency
4. `apps/web/src/components/year-picker.tsx` — Year picker
5. `apps/web/src/components/app-sidebar.tsx` — Sidebar nav
6. `apps/web/src/components/expense-pivot-table.tsx` — Pivot table
7. `apps/web/src/routes/_authenticated.reports.expenses.tsx` — Page

---

## Verification

- [x] Navigate to `/reports/expenses`
- [x] Year picker changes displayed data
- [x] Filters narrow results correctly
- [x] Service rows collapse/expand, state persists
- [x] Amounts correctly pro-rated across months
- [x] Grand total row sums correctly
- [x] Empty state appears when no data
- [x] CSV export downloads correctly
- [x] URL params update with filters/year
- [x] Typecheck passes in both apps
- [x] Lint passes

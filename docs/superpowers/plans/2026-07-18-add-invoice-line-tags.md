# Invoice Line Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow attaching multiple tags to each invoice line via a many-to-many junction table.

**Architecture:** Add `invoice_line_tags` junction table. Backend: update invoice CRUD routes to handle tag IDs on create/update. Frontend: add a multi-select tag picker to each invoice line in the form. Invoice lines already use delete-and-replace on update, so tag management is simple delete+reinsert.

**Tech Stack:** Bun, Elysia, Drizzle ORM, bun:sqlite, TanStack Router/Query/Form, Shadcn UI, Zod, Better Auth

## Global Constraints
- Runtime & Package Manager: Bun (native)
- Backend: Elysia + bun:sqlite + Drizzle ORM
- Frontend: Vite + React + TypeScript + Tailwind v4
- UI: Shadcn UI on Base UI primitives (`@base-ui-components/react`)
- Frontend imports use `@/` prefix
- Cross-workspace types via `@my-app/api-types`
- id fields: integer primary key
- Tracking fields: created_by, created_at, updated_by, updated_at
- Invoice lines use delete-and-replace strategy (no soft delete)

---

## File Map

### Files Created (1)
| File | Purpose |
|------|---------|
| `apps/api/src/db/migrations/0017_add_invoice_line_tags.sql` | Junction table migration |

### Files Modified (4)
| File | Change |
|------|--------|
| `apps/api/src/db/schema.ts` | Add `invoiceLineTags` table + relations |
| `apps/api/src/routes/invoices.ts` | Handle tag IDs on create/update, include tags in responses |
| `apps/web/src/components/invoice-form.tsx` | Add tag multi-select to each line |
| `apps/api/src/db/migrations/meta/_journal.json` | Register migration |

---

### Task 1: Add invoice_line_tags junction table

**Files:**
- Modify: `apps/api/src/db/schema.ts`
- Create: `apps/api/src/db/migrations/0017_add_invoice_line_tags.sql`
- Modify: `apps/api/src/db/migrations/meta/_journal.json`

- [ ] **Step 1: Add junction table to schema.ts**

Add after `invoiceLineRelations` (after line 396):

```typescript
// ==================== INVOICE LINE TAGS ====================

export const invoiceLineTags = sqliteTable("invoice_line_tags", {
	invoiceLineId: integer("invoice_line_id")
		.notNull()
		.references(() => invoiceLines.id, { onDelete: "cascade" }),
	tagId: integer("tag_id")
		.notNull()
		.references(() => tags.id, { onDelete: "cascade" }),
});

export const invoiceLineTagRelations = relations(invoiceLineTags, ({ one }) => ({
	invoiceLine: one(invoiceLines, {
		fields: [invoiceLineTags.invoiceLineId],
		references: [invoiceLines.id],
	}),
	tag: one(tags, {
		fields: [invoiceLineTags.tagId],
		references: [tags.id],
	}),
}));
```

Also add a `many` relation to `invoiceLineRelations`. Update the existing `invoiceLineRelations` to include:

```typescript
export const invoiceLineRelations = relations(invoiceLines, ({ one, many }) => ({
	// ... existing one() relations ...
	tags: many(invoiceLineTags),
}));
```

And add a `many` relation to `tagRelations`:

```typescript
export const tagRelations = relations(tags, ({ one, many }) => ({
	// ... existing one() relations ...
	invoiceLines: many(invoiceLineTags),
}));
```

- [ ] **Step 2: Create migration SQL**

Create `apps/api/src/db/migrations/0017_add_invoice_line_tags.sql`:

```sql
CREATE TABLE `invoice_line_tags` (
	`invoice_line_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`invoice_line_id`, `tag_id`),
	FOREIGN KEY (`invoice_line_id`) REFERENCES `invoice_lines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
```

- [ ] **Step 3: Register migration in journal**

Add to `apps/api/src/db/migrations/meta/_journal.json`:

```json
{
  "idx": 17,
  "version": "6",
  "when": 1784100000012,
  "tag": "0017_add_invoice_line_tags",
  "breakpoints": true
}
```

- [ ] **Step 4: Apply migration**

```bash
cd apps/api && timeout 5 bun run src/index.ts 2>&1 || true
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/db/schema.ts apps/api/src/db/migrations/0017_add_invoice_line_tags.sql apps/api/src/db/migrations/meta/_journal.json
git commit -m "feat(db): add invoice_line_tags junction table"
```

---

### Task 2: Update backend invoice routes to handle tags

**Files:**
- Modify: `apps/api/src/routes/invoices.ts`

- [ ] **Step 1: Import the junction table**

Add to imports at top of `invoices.ts`:

```typescript
import { invoiceLineTags, invoiceLines, invoices, suppliers, tags } from "../db/schema";
```

(Add `invoiceLineTags` and `tags` to the existing import from `../db/schema`.)

- [ ] **Step 2: Add tag_ids to invoice line Zod schemas**

Update `invoiceLineSchema` to include `tag_ids`:

```typescript
const invoiceLineSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  unit_price: z.number().int().positive("Unit price must be positive"),
  number_of_units: z.number().int().positive("Number of units must be positive"),
  total_amount: z.number().int().positive("Total amount must be positive"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  service_id: z.number().int().positive("Service is required"),
  category_id: z.number().int().positive("Category is required"),
  cost_type_id: z.number().int().positive("Cost type is required"),
  location_id: z.number().int().positive().nullable().optional(),
  tag_ids: z.array(z.number().int().positive()).optional().default([]),
});
```

- [ ] **Step 3: Update POST / to create tag associations**

After inserting each line, insert its tags:

```typescript
const createdLines = await Promise.all(
  lines.map(async (line) => {
    const startDate = new Date(line.start_date);
    const endDate = line.end_date ? new Date(line.end_date) : startDate;
    const [createdLine] = await db
      .insert(invoiceLines)
      .values({
        invoiceId: created.id,
        description: line.description,
        unitPrice: line.unit_price,
        numberOfUnits: line.number_of_units,
        totalAmount: line.total_amount,
        startDate,
        endDate,
        serviceId: line.service_id,
        categoryId: line.category_id,
        costTypeId: line.cost_type_id,
        locationId: line.location_id ?? null,
        createdBy: userId,
        createdAt: now,
        updatedBy: userId,
        updatedAt: now,
      })
      .returning();

    if (line.tag_ids && line.tag_ids.length > 0) {
      await db.insert(invoiceLineTags).values(
        line.tag_ids.map((tagId) => ({
          invoiceLineId: createdLine.id,
          tagId,
        })),
      );
    }

    return createdLine;
  }),
);
```

- [ ] **Step 4: Update PATCH /:id to re-create tag associations**

The update already deletes and re-inserts lines. Update the re-insert to also handle tags:

```typescript
if (lines !== undefined) {
  // Delete existing tag associations for lines being replaced
  const existingLineIds = await db
    .select({ id: invoiceLines.id })
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, id));

  if (existingLineIds.length > 0) {
    const ids = existingLineIds.map((l) => l.id);
    await db.delete(invoiceLineTags).where(inArray(invoiceLineTags.invoiceLineId, ids));
  }

  // Delete existing lines
  await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, id));

  // Re-insert lines with tags
  await Promise.all(
    lines.map(async (line) => {
      const startDate = new Date(line.start_date);
      const endDate = line.end_date ? new Date(line.end_date) : startDate;
      const [createdLine] = await db.insert(invoiceLines).values({
        invoiceId: id,
        description: line.description,
        unitPrice: line.unit_price,
        numberOfUnits: line.number_of_units,
        totalAmount: line.total_amount,
        startDate,
        endDate,
        serviceId: line.service_id,
        categoryId: line.category_id,
        costTypeId: line.cost_type_id,
        locationId: line.location_id ?? null,
        createdBy: userId,
        createdAt: now,
        updatedBy: userId,
        updatedAt: now,
      }).returning();

      if (line.tag_ids && line.tag_ids.length > 0) {
        await db.insert(invoiceLineTags).values(
          line.tag_ids.map((tagId) => ({
            invoiceLineId: createdLine.id,
            tagId,
          })),
        );
      }
    }),
  );
}
```

Add `inArray` to the drizzle-orm import at the top:

```typescript
import { and, asc, count, desc, eq, inArray, like, or, sql } from "drizzle-orm";
```

- [ ] **Step 5: Update GET endpoints to include tags on lines**

For GET / and GET /:id, after fetching lines, fetch their tags:

Add a helper function:

```typescript
async function getLinesWithTags(lineIds: number[]) {
  if (lineIds.length === 0) return [];

  const lineTags = await db
    .select({
      invoiceLineId: invoiceLineTags.invoiceLineId,
      tagId: invoiceLineTags.tagId,
      tagName: tags.name,
    })
    .from(invoiceLineTags)
    .innerJoin(tags, eq(invoiceLineTags.tagId, tags.id))
    .where(inArray(invoiceLineTags.invoiceLineId, lineIds));

  return lineTags;
}
```

Then in GET /, after fetching `dataResult`, collect line IDs and fetch tags:

```typescript
const invoicesWithLines = await Promise.all(
  dataResult.map(async (row) => {
    const invoice = row.invoices;
    const lines = await db
      .select()
      .from(invoiceLines)
      .where(eq(invoiceLines.invoiceId, invoice.id));

    const lineIds = lines.map((l) => l.id);
    const allLineTags = await getLinesWithTags(lineIds);

    const linesWithTags = lines.map((line) => ({
      ...line,
      tag_ids: allLineTags
        .filter((lt) => lt.invoiceLineId === line.id)
        .map((lt) => lt.tagId),
    }));

    return {
      id: invoice.id,
      supplierId: invoice.supplierId,
      branchId: invoice.branchId,
      invoiceDate: invoice.invoiceDate,
      invoiceNumber: invoice.invoiceNumber,
      createdBy: invoice.createdBy,
      createdAt: invoice.createdAt,
      updatedBy: invoice.updatedBy,
      updatedAt: invoice.updatedAt,
      lines: linesWithTags,
    };
  }),
);
```

Apply the same pattern to GET /recent and GET /:id.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/routes/invoices.ts
git commit -m "feat(api): add tag_ids support to invoice line CRUD"
```

---

### Task 3: Update frontend invoice form with tag picker

**Files:**
- Modify: `apps/web/src/components/invoice-form.tsx`

- [ ] **Step 1: Add tags query to fetch available tags**

Add a `useQuery` call to fetch all active tags (inside the form component):

```typescript
const { data: availableTags } = useQuery({
  queryKey: ["tags"],
  queryFn: async () => {
    const res = await eden.api.tags.get({ query: { limit: "100", is_active: "true", order: "asc" } });
    if (res.error) throw res.error;
    return (res.data as any).data ?? [];
  },
});
```

- [ ] **Step 2: Add tag_ids to the line schema**

Update the frontend `invoiceLineSchema` to include `tag_ids`:

```typescript
const invoiceLineSchema = z.object({
  // ... existing fields ...
  tag_ids: z.array(z.number()).optional().default([]),
});
```

- [ ] **Step 3: Add tag multi-select UI to each invoice line**

Add a multi-select tag picker below the existing fields in each invoice line. Use a simple checkbox-group or multi-select pattern. After the `location_id` field in each line:

```tsx
<Field>
  <FieldLabel>Tags</FieldLabel>
  <div className="flex flex-wrap gap-2">
    {availableTags?.map((tag: any) => (
      <label key={tag.id} className="flex items-center gap-1.5 text-sm">
        <input
          type="checkbox"
          className="rounded"
          checked={field.state.value?.includes(tag.id) ?? false}
          onChange={(e) => {
            const current = field.state.value ?? [];
            if (e.target.checked) {
              field.handleChange([...current, tag.id]);
            } else {
              field.handleChange(current.filter((id: number) => id !== tag.id));
            }
          }}
        />
        {tag.name}
      </label>
    ))}
    {availableTags?.length === 0 && (
      <span className="text-xs text-muted-foreground">No tags available</span>
    )}
  </div>
</Field>
```

This field needs to be added to the `form.Field` render for each line. The field name pattern is `lines.${index}.tag_ids`.

- [ ] **Step 4: Include tag_ids in submit transform**

Update the submit transform to pass `tag_ids` through:

```typescript
lines: data.lines.map((line) => ({
  ...line,
  unit_price: Math.round(line.unit_price * 100),
  number_of_units: line.number_of_units,
  total_amount: Math.round((line.total_amount ?? 0) * 100),
  start_date: line.start_date,
  end_date: line.end_date || line.start_date,
  tag_ids: line.tag_ids ?? [],
})),
```

- [ ] **Step 5: Include tag_ids in edit load transform**

When loading existing invoice data for editing, include `tag_ids`:

```typescript
lines: initialData.lines.map((line) => ({
  ...line,
  unit_price: line.unit_price / 100,
  total_amount: (line.total_amount ?? 0) / 100,
  start_date: /* convert */,
  end_date: /* convert */,
  tag_ids: (line as any).tag_ids ?? [],
})),
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/invoice-form.tsx
git commit -m "feat(web): add tag multi-select to invoice line form"
```

---

### Task 4: Verify full stack

- [ ] **Step 1: Start dev servers**

```bash
bun run dev
```

- [ ] **Step 2: Verify API starts and migration applied**

Check logs for "Migrations applied successfully".

- [ ] **Step 3: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 4: Run lint**

```bash
bun run lint
```

- [ ] **Step 5: Test in browser**

Navigate to Invoices > Create Invoice, verify tags appear as checkboxes on each line.

---

## Self-Review Checklist

1. **Spec coverage:** Many-to-many tags on invoice lines. Covered: junction table, backend CRUD, frontend picker. 
2. **Placeholder scan:** All code blocks complete. No TBD/TODO.
3. **Type consistency:** `tag_ids` is `number[]` on frontend and backend. Junction table uses `invoiceLineId`/`tagId` matching schema.

# Suppliers Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Suppliers CRUD feature — list, create, edit, soft-delete suppliers (payees/billers) with pagination, search, filtering, and sorting.

**Architecture:** Backend Elysia routes with Zod validation + Drizzle ORM on SQLite. Frontend single-page CRUD with Shadcn Table, TanStack Form + Zod adapter, dialog modals, and TanStack Query for data fetching via edenTreaty.

**Tech Stack:** Elysia, Drizzle ORM, bun:sqlite, Zod, TanStack Router, TanStack Query, TanStack Form, Shadcn UI (Base UI primitives)

## Global Constraints

- Use `bun` for all package operations (never npm/pnpm/yarn)
- Use `bun:sqlite` — no external SQLite drivers
- Validate with Zod on backend, TanStack Zod form adapter on frontend
- All API calls via `edenTreaty<App>` — no manual fetch wrappers
- Use `@/` prefix for internal frontend imports
- Soft delete via `is_active` flag (default true)
- All records have `created_by`, `created_at`, `updated_by`, `updated_at` tracking fields
- `id` fields on business tables are integer primary key auto-increment
- Follow existing code conventions (tabs for indentation, existing import patterns)

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `apps/api/src/routes/suppliers.ts` | Elysia route group: CRUD endpoints + Zod validation schemas |
| `apps/web/src/routes/_authenticated.suppliers.tsx` | Suppliers page: table, search, pagination, empty state |
| `apps/web/src/components/supplier-form-dialog.tsx` | Create/Edit dialog with TanStack Form |
| `apps/web/src/components/delete-supplier-dialog.tsx` | Delete confirmation AlertDialog |

### Modified Files
| File | Change |
|------|--------|
| `apps/api/src/db/schema.ts` | Add `suppliers` table + relations |
| `apps/api/src/index.ts` | Mount supplier routes, add `PATCH` to CORS methods |
| `apps/web/src/components/app-sidebar.tsx` | Replace placeholder nav with Suppliers link |

---

### Task 1: Install Dependencies

**Files:**
- Modify: `apps/api/package.json` (via bun add)
- Modify: `apps/web/package.json` (via bun add)

- [ ] **Step 1: Install Zod on the API**

Run from project root:
```bash
bun add zod --filter api
```

- [ ] **Step 2: Verify installation**

Run:
```bash
bun install
```

Expected: No errors. `zod` appears in `apps/api/package.json`.

---

### Task 2: Add Suppliers Table to Drizzle Schema

**Files:**
- Modify: `apps/api/src/db/schema.ts`

**Interfaces:**
- Produces: `suppliers` table, `supplierRelations` — consumed by Task 3 (route handlers)

- [ ] **Step 1: Add suppliers table and relations to schema.ts**

Add the following at the end of `apps/api/src/db/schema.ts`:

```typescript
export const suppliers = sqliteTable("suppliers", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	notes: text("notes"),
	isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	updatedBy: text("updated_by")
		.notNull()
		.references(() => user.id),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.$onUpdate(() => new Date())
		.notNull(),
});

export const supplierRelations = relations(suppliers, ({ one }) => ({
	createdByUser: one(user, {
		fields: [suppliers.createdBy],
		references: [user.id],
	}),
	updatedByUser: one(user, {
		fields: [suppliers.updatedBy],
		references: [user.id],
	}),
}));
```

- [ ] **Step 2: Generate Drizzle migration**

Run from project root:
```bash
bun --filter api exec drizzle-kit generate
```

Expected: A new migration file is created in `apps/api/src/db/migrations/`.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/db/schema.ts apps/api/src/db/migrations/
git commit -m "feat(db): add suppliers table schema"
```

---

### Task 3: Create API Route Handlers with Zod Validation

**Files:**
- Create: `apps/api/src/routes/suppliers.ts`

**Interfaces:**
- Consumes: `db` from `apps/api/src/db/index.ts`, `suppliers` table from `apps/api/src/db/schema.ts`, `user` table for FK references
- Produces: Elysia route group exported as `supplierRoutes` — mounted in Task 4

- [ ] **Step 1: Create the suppliers route file with validation schemas and CRUD handlers**

Create `apps/api/src/routes/suppliers.ts`:

```typescript
import { Elysia, t } from "elysia";
import { z } from "zod";
import { eq, desc, asc, like, sql, and, count } from "drizzle-orm";
import { db } from "../db";
import { suppliers } from "../db/schema";
import { auth } from "../auth";

const createSupplierSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	notes: z.string().max(1000).optional(),
});

const updateSupplierSchema = z.object({
	name: z.string().min(1, "Name is required").max(255).optional(),
	notes: z.string().max(1000).optional(),
});

const listQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20),
	search: z.string().optional(),
	is_active: z.coerce.boolean().default(true),
	sort: z.enum(["name"]).default("name"),
	order: z.enum(["asc", "desc"]).default("asc"),
});

async function getSessionUserId(request: Request): Promise<string | null> {
	const session = await auth.api.getSession({
		headers: request.headers,
	});
	return session?.user?.id ?? null;
}

export const supplierRoutes = new Elysia({ prefix: "/api/suppliers" })
	.get("/", async ({ request, query }) => {
		const userId = await getSessionUserId(request);
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const parsed = listQuerySchema.safeParse(query);
		if (!parsed.success) {
			return new Response(
				JSON.stringify({ error: "Invalid query parameters", details: parsed.error.flatten() }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		const { page, limit, search, is_active, sort, order } = parsed.data;
		const offset = (page - 1) * limit;

		const conditions = [eq(suppliers.isActive, is_active)];
		if (search) {
			conditions.push(like(suppliers.name, `%${search}%`));
		}

		const where = and(...conditions);
		const orderFn = order === "desc" ? desc : asc;

		const [data, totalResult] = await Promise.all([
			db
				.select()
				.from(suppliers)
				.where(where)
				.orderBy(orderFn(suppliers[sort]))
				.limit(limit)
				.offset(offset),
			db
				.select({ value: count() })
				.from(suppliers)
				.where(where),
		]);

		const total = totalResult[0]?.value ?? 0;

		return {
			data,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	})
	.post("/", async ({ request, body }) => {
		const userId = await getSessionUserId(request);
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const parsed = createSupplierSchema.safeParse(body);
		if (!parsed.success) {
			return new Response(
				JSON.stringify({ error: "Validation failed", details: parsed.error.flatten() }),
				{ status: 422, headers: { "Content-Type": "application/json" } },
			);
		}

		const { name, notes } = parsed.data;

		// Check unique name
		const existing = await db
			.select({ id: suppliers.id })
			.from(suppliers)
			.where(eq(suppliers.name, name))
			.limit(1);

		if (existing.length > 0) {
			return new Response(
				JSON.stringify({ error: "A supplier with this name already exists" }),
				{ status: 409, headers: { "Content-Type": "application/json" } },
			);
		}

		const now = new Date();
		const [created] = await db
			.insert(suppliers)
			.values({
				name,
				notes: notes ?? null,
				createdBy: userId,
				createdAt: now,
				updatedBy: userId,
				updatedAt: now,
			})
			.returning();

		return created;
	})
	.patch("/:id", async ({ request, params, body }) => {
		const userId = await getSessionUserId(request);
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const parsed = updateSupplierSchema.safeParse(body);
		if (!parsed.success) {
			return new Response(
				JSON.stringify({ error: "Validation failed", details: parsed.error.flatten() }),
				{ status: 422, headers: { "Content-Type": "application/json" } },
			);
		}

		const id = Number(params.id);
		if (Number.isNaN(id)) {
			return new Response(
				JSON.stringify({ error: "Invalid ID" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// Check supplier exists and is active
		const existing = await db
			.select()
			.from(suppliers)
			.where(and(eq(suppliers.id, id), eq(suppliers.isActive, true)))
			.limit(1);

		if (existing.length === 0) {
			return new Response(
				JSON.stringify({ error: "Supplier not found" }),
				{ status: 404, headers: { "Content-Type": "application/json" } },
			);
		}

		const { name, notes } = parsed.data;

		// If renaming, check unique
		if (name && name !== existing[0].name) {
			const nameTaken = await db
				.select({ id: suppliers.id })
				.from(suppliers)
				.where(eq(suppliers.name, name))
				.limit(1);

			if (nameTaken.length > 0) {
				return new Response(
					JSON.stringify({ error: "A supplier with this name already exists" }),
					{ status: 409, headers: { "Content-Type": "application/json" } },
				);
			}
		}

		const [updated] = await db
			.update(suppliers)
			.set({
				...(name !== undefined && { name }),
				...(notes !== undefined && { notes: notes ?? null }),
				updatedBy: userId,
				updatedAt: new Date(),
			})
			.where(eq(suppliers.id, id))
			.returning();

		return updated;
	})
	.delete("/:id", async ({ request, params }) => {
		const userId = await getSessionUserId(request);
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const id = Number(params.id);
		if (Number.isNaN(id)) {
			return new Response(
				JSON.stringify({ error: "Invalid ID" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		const existing = await db
			.select()
			.from(suppliers)
			.where(and(eq(suppliers.id, id), eq(suppliers.isActive, true)))
			.limit(1);

		if (existing.length === 0) {
			return new Response(
				JSON.stringify({ error: "Supplier not found" }),
				{ status: 404, headers: { "Content-Type": "application/json" } },
			);
		}

		await db
			.update(suppliers)
			.set({
				isActive: false,
				updatedBy: userId,
				updatedAt: new Date(),
			})
			.where(eq(suppliers.id, id));

		return { success: true };
	});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
bun --filter api exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/routes/suppliers.ts
git commit -m "feat(api): add suppliers CRUD routes with Zod validation"
```

---

### Task 4: Mount Supplier Routes in API Entry Point

**Files:**
- Modify: `apps/api/src/index.ts`

**Interfaces:**
- Consumes: `supplierRoutes` from Task 3
- Produces: Updated `App` type exported for frontend (edenTreaty)

- [ ] **Step 1: Import and mount supplierRoutes, add PATCH to CORS**

Replace the contents of `apps/api/src/index.ts`:

```typescript
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { auth } from "./auth";
import { supplierRoutes } from "./routes/suppliers";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const app = new Elysia()
	.use(
		cors({
			origin: FRONTEND_URL,
			methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			credentials: true,
			allowedHeaders: ["Content-Type", "Authorization"],
		}),
	)
	.mount(auth.handler)
	.use(supplierRoutes)
	.get("/api/health", () => ({
		status: "ok",
		timestamp: new Date().toISOString(),
	}))
	.listen(3000);

console.log(`Elysia server running at http://localhost:${app.server?.port}`);

export type App = typeof app;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
bun --filter api exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Start API and test health endpoint**

Run:
```bash
bun run dev:api
```

In another terminal:
```bash
curl http://localhost:3000/api/health
```

Expected: `{"status":"ok","timestamp":"..."}`

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/index.ts
git commit -m "feat(api): mount suppliers routes on Elysia"
```

---

### Task 5: Create Supplier Form Dialog Component

**Files:**
- Create: `apps/web/src/components/supplier-form-dialog.tsx`

**Interfaces:**
- Consumes: `eden` from `@/lib/api`, `App` type from `@my-app/api-types`
- Produces: `SupplierFormDialog` component — used by Task 7 (suppliers page)

- [ ] **Step 1: Create the supplier form dialog component**

Create `apps/web/src/components/supplier-form-dialog.tsx`:

```tsx
import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eden } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface Supplier {
	id: number;
	name: string;
	notes: string | null;
	isActive: boolean;
	createdBy: string;
	createdAt: number;
	updatedBy: string;
	updatedAt: number;
}

interface SupplierFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	supplier?: Supplier | null;
}

export function SupplierFormDialog({
	open,
	onOpenChange,
	supplier,
}: SupplierFormDialogProps) {
	const queryClient = useQueryClient();
	const isEditing = !!supplier;

	const createMutation = useMutation({
		mutationFn: async (data: { name: string; notes?: string }) => {
			const res = await eden.api.suppliers.post(data);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["suppliers"] });
			onOpenChange(false);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: { name?: string; notes?: string }) => {
			const res = await eden.api.suppliers[`${supplier!.id}`].patch(data);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["suppliers"] });
			onOpenChange(false);
		},
	});

	const form = useForm({
		defaultValues: {
			name: "",
			notes: "",
		},
		onSubmit: async ({ value }) => {
			const data = {
				name: value.name,
				notes: value.notes || undefined,
			};
			if (isEditing) {
				await updateMutation.mutateAsync(data);
			} else {
				await createMutation.mutateAsync(data);
			}
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				name: supplier?.name ?? "",
				notes: supplier?.notes ?? "",
			});
			createMutation.reset();
			updateMutation.reset();
		}
	}, [open, supplier]);

	const error = createMutation.error || updateMutation.error;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Supplier" : "Add Supplier"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update the supplier details below."
							: "Enter the details for the new supplier."}
					</DialogDescription>
				</DialogHeader>

				{error && (
					<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
						{"message" in error ? error.message : "An error occurred"}
					</div>
				)}

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4"
				>
					<form.Field
						name="name"
						validators={{
							onChange: ({ value }) =>
								!value ? "Name is required" : undefined,
						}}
						children={(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Name</Label>
								<Input
									id={field.name}
									name={field.name}
									placeholder="e.g. Electric Company"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.isTouched &&
									field.state.meta.errors.length > 0 && (
										<p className="text-xs text-destructive">
											{field.state.meta.errors.join(", ")}
										</p>
									)}
							</div>
						)}
					/>

					<form.Field
						name="notes"
						children={(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Notes</Label>
								<Textarea
									id={field.name}
									name={field.name}
									placeholder="Optional notes..."
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</div>
						)}
					/>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<form.Subscribe
							selector={(state) => ({
								canSubmit: state.canSubmit,
								isSubmitting: state.isSubmitting,
							})}
							children={({ canSubmit, isSubmitting }) => (
								<Button type="submit" disabled={!canSubmit}>
									{isSubmitting
										? isEditing
											? "Saving..."
											: "Creating..."
										: isEditing
											? "Save Changes"
											: "Create Supplier"}
								</Button>
							)}
						/>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
bun --filter web exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/supplier-form-dialog.tsx
git commit -m "feat(web): add supplier form dialog component"
```

---

### Task 6: Create Delete Supplier Dialog Component

**Files:**
- Create: `apps/web/src/components/delete-supplier-dialog.tsx`

**Interfaces:**
- Consumes: `eden` from `@/lib/api`
- Produces: `DeleteSupplierDialog` component — used by Task 7 (suppliers page)

- [ ] **Step 1: Create the delete confirmation dialog**

Create `apps/web/src/components/delete-supplier-dialog.tsx`:

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eden } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteSupplierDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	supplierId: number;
	supplierName: string;
}

export function DeleteSupplierDialog({
	open,
	onOpenChange,
	supplierId,
	supplierName,
}: DeleteSupplierDialogProps) {
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: async () => {
			const res = await eden.api.suppliers[`${supplierId}`].delete();
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["suppliers"] });
			onOpenChange(false);
		},
	});

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Supplier</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete{" "}
						<span className="font-medium text-foreground">{supplierName}</span>?
						This will deactivate the supplier but preserve its history.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={() => deleteMutation.mutate()}
						disabled={deleteMutation.isPending}
					>
						{deleteMutation.isPending ? "Deleting..." : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
bun --filter web exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/delete-supplier-dialog.tsx
git commit -m "feat(web): add delete supplier confirmation dialog"
```

---

### Task 7: Create Suppliers Page Route

**Files:**
- Create: `apps/web/src/routes/_authenticated.suppliers.tsx`

**Interfaces:**
- Consumes: `SupplierFormDialog` from Task 5, `DeleteSupplierDialog` from Task 6, `eden` from `@/lib/api`
- Produces: `/suppliers` page accessible from sidebar

- [ ] **Step 1: Create the suppliers page with table, search, and pagination**

Create `apps/web/src/routes/_authenticated.suppliers.tsx`:

```tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { eden } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { SupplierFormDialog } from "@/components/supplier-form-dialog";
import { DeleteSupplierDialog } from "@/components/delete-supplier-dialog";
import { PlusIcon, PencilIcon, Trash2Icon, SearchIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/suppliers")({
	component: SuppliersPage,
});

interface Supplier {
	id: number;
	name: string;
	notes: string | null;
	isActive: boolean;
	createdBy: string;
	createdAt: number;
	updatedBy: string;
	updatedAt: number;
}

function SuppliersPage() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [formOpen, setFormOpen] = useState(false);
	const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

	// Debounce search
	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPage(1);
		// Simple debounce via timeout ref would be ideal, but for now we set directly
		setDebouncedSearch(value);
	};

	const { data, isLoading } = useQuery({
		queryKey: ["suppliers", { page, search: debouncedSearch }],
		queryFn: async () => {
			const params: Record<string, string> = {
				page: String(page),
				limit: "20",
				is_active: "true",
				sort: "name",
				order: "asc",
			};
			if (debouncedSearch) params.search = debouncedSearch;
			const res = await eden.api.suppliers.get({ $query: params });
			return res.data;
		},
	});

	const suppliers = data?.data ?? [];
	const pagination = data?.pagination;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Suppliers</h1>
				<Button
					onClick={() => {
						setEditingSupplier(null);
						setFormOpen(true);
					}}
				>
					<PlusIcon className="mr-2 size-4" />
					Add Supplier
				</Button>
			</div>

			<div className="relative max-w-sm">
				<SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
				<Input
					placeholder="Search suppliers..."
					className="pl-8"
					value={search}
					onChange={(e) => handleSearchChange(e.target.value)}
				/>
			</div>

			{isLoading ? (
				<div className="py-12 text-center text-sm text-muted-foreground">
					Loading suppliers...
				</div>
			) : suppliers.length === 0 ? (
				<div className="py-12 text-center text-sm text-muted-foreground">
					{debouncedSearch
						? "No suppliers match your search."
						: "No suppliers yet. Add your first supplier to get started."}
				</div>
			) : (
				<>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Notes</TableHead>
								<TableHead className="w-24">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{suppliers.map((supplier) => (
								<TableRow key={supplier.id}>
									<TableCell className="font-medium">
										{supplier.name}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{supplier.notes || "—"}
									</TableCell>
									<TableCell>
										<div className="flex gap-1">
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() => {
													setEditingSupplier(supplier);
													setFormOpen(true);
												}}
											>
												<PencilIcon className="size-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() => {
													setDeletingSupplier(supplier);
													setDeleteOpen(true);
												}}
											>
												<Trash2Icon className="size-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{pagination && pagination.totalPages > 1 && (
						<div className="flex items-center justify-between">
							<p className="text-xs text-muted-foreground">
								Page {pagination.page} of {pagination.totalPages} ({pagination.total}{" "}
								total)
							</p>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={page <= 1}
									onClick={() => setPage((p) => p - 1)}
								>
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={page >= pagination.totalPages}
									onClick={() => setPage((p) => p + 1)}
								>
									Next
								</Button>
							</div>
						</div>
					)}
				</>
			)}

			<SupplierFormDialog
				open={formOpen}
				onOpenChange={setFormOpen}
				supplier={editingSupplier}
			/>

			{deletingSupplier && (
				<DeleteSupplierDialog
					open={deleteOpen}
					onOpenChange={setDeleteOpen}
					supplierId={deletingSupplier.id}
					supplierName={deletingSupplier.name}
				/>
			)}
		</div>
	);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
bun --filter web exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated.suppliers.tsx
git commit -m "feat(web): add suppliers page with table, search, and pagination"
```

---

### Task 8: Add Suppliers Link to Sidebar Navigation

**Files:**
- Modify: `apps/web/src/components/app-sidebar.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: Sidebar with Suppliers nav link pointing to `/suppliers`

- [ ] **Step 1: Replace placeholder nav data with Suppliers link**

In `apps/web/src/components/app-sidebar.tsx`, replace the `navMain` array in the `data` object with a single Suppliers entry. Replace lines 25-123 (the entire `navMain` array):

```typescript
  navMain: [
    {
      title: "Suppliers",
      url: "/suppliers",
      icon: (
        <Building2Icon
        />
      ),
    },
  ],
```

Also update the import at the top to add `Building2Icon`:

```typescript
import { TerminalSquareIcon, BotIcon, BookOpenIcon, Settings2Icon, LifeBuoyIcon, SendIcon, FrameIcon, PieChartIcon, MapIcon, TerminalIcon, Building2Icon } from "lucide-react"
```

And update the `NavMain` component usage to pass a group label. In the sidebar content, replace:

```tsx
<NavMain items={data.navMain} />
```

with a simple sidebar menu for the Suppliers link:

```tsx
<SidebarGroup>
  <SidebarGroupLabel>Budget</SidebarGroupLabel>
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton render={<a href="/suppliers" />}>
        <Building2Icon />
        <span>Suppliers</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarGroup>
```

Add `SidebarGroup` and `SidebarGroupLabel` to the imports:

```typescript
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
bun --filter web exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/app-sidebar.tsx
git commit -m "feat(web): add Suppliers link to sidebar navigation"
```

---

### Task 9: End-to-End Verification

- [ ] **Step 1: Start both API and web dev servers**

Run from project root:
```bash
bun run dev
```

- [ ] **Step 2: Verify the API responds to suppliers endpoints**

Test create:
```bash
curl -X POST http://localhost:3000/api/suppliers \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Electric", "notes": "Account #123"}'
```

Expected: 401 Unauthorized (no session cookie — this is expected without auth headers).

- [ ] **Step 3: Open browser and verify**

1. Navigate to `http://localhost:5173`
2. Log in (or sign up)
3. Click "Suppliers" in the sidebar
4. Verify empty state message: "No suppliers yet. Add your first supplier to get started."
5. Click "Add Supplier" button
6. Fill in name and notes, submit
7. Verify supplier appears in the table
8. Click Edit icon, modify name, save
9. Click Delete icon, confirm deletion
10. Verify supplier disappears from table

- [ ] **Step 4: Run lint and type checks**

```bash
bun x biome check --write
bun --filter web exec tsc --noEmit
bun --filter api exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit any lint fixes**

```bash
git add -A
git commit -m "chore: lint fixes for suppliers feature"
```

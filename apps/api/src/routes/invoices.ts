import { and, asc, count, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod";
import { auth } from "../auth";
import { db } from "../db";
import {
	invoiceLines,
	invoiceLineTags,
	invoices,
	suppliers,
	tags,
} from "../db/schema";

const invoiceLineSchema = z.object({
	description: z.string().min(1, "Description is required").max(500),
	unit_price: z.number().int().positive("Unit price must be positive"),
	number_of_units: z
		.number()
		.int()
		.positive("Number of units must be positive"),
	total_amount: z.number().int().positive("Total amount must be positive"),
	start_date: z.string().min(1, "Start date is required"),
	end_date: z.string().optional(),
	service_id: z.number().int().positive("Service is required"),
	category_id: z.number().int().positive("Category is required"),
	cost_type_id: z.number().int().positive("Cost type is required"),
	location_id: z.number().int().positive().nullable().optional(),
	tag_ids: z.array(z.number().int().positive()).optional().default([]),
});

const createInvoiceSchema = z.object({
	supplier_id: z.number().int().positive("Supplier is required"),
	branch_id: z.number().int().positive("Branch is required"),
	invoice_date: z.string().min(1, "Invoice date is required"),
	invoice_number: z.string().min(1, "Invoice number is required").max(100),
	lines: z
		.array(invoiceLineSchema)
		.min(1, "At least one invoice line is required"),
});

const updateInvoiceSchema = z.object({
	supplier_id: z.number().int().positive("Supplier is required").optional(),
	branch_id: z.number().int().positive("Branch is required").optional(),
	invoice_date: z.string().optional(),
	invoice_number: z
		.string()
		.min(1, "Invoice number is required")
		.max(100)
		.optional(),
	lines: z.array(invoiceLineSchema).optional(),
});

const listQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20),
	search: z.string().optional(),
	sort: z
		.enum(["invoiceDate", "invoiceNumber", "supplierName"])
		.default("invoiceDate"),
	order: z.enum(["asc", "desc"]).default("desc"),
});

async function getSessionUserId(request: Request): Promise<string | null> {
	const session = await auth.api.getSession({
		headers: request.headers,
	});
	return session?.user?.id ?? null;
}

async function getLinesWithTags(lines: { id: number }[]) {
	if (lines.length === 0) return [];

	const lineIds = lines.map((l) => l.id);
	const allLineTags = await db
		.select({
			invoiceLineId: invoiceLineTags.invoiceLineId,
			tagId: invoiceLineTags.tagId,
			tagName: tags.name,
		})
		.from(invoiceLineTags)
		.innerJoin(tags, eq(invoiceLineTags.tagId, tags.id))
		.where(inArray(invoiceLineTags.invoiceLineId, lineIds));

	return allLineTags;
}

export const invoiceRoutes = new Elysia({ prefix: "/api/invoices" })
	.get("/recent", async ({ request, query }) => {
		const userId = await getSessionUserId(request);
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const supplierId = query.supplierId ? Number(query.supplierId) : undefined;

		const data = await db
			.select()
			.from(invoices)
			.where(supplierId ? eq(invoices.supplierId, supplierId) : undefined)
			.orderBy(desc(invoices.invoiceDate))
			.limit(10);

		const invoicesWithLines = await Promise.all(
			data.map(async (invoice) => {
				const lines = await db
					.select()
					.from(invoiceLines)
					.where(eq(invoiceLines.invoiceId, invoice.id));

				const allLineTags = await getLinesWithTags(lines);
				const linesWithTags = lines.map((line) => ({
					...line,
					tag_ids: allLineTags
						.filter((lt) => lt.invoiceLineId === line.id)
						.map((lt) => lt.tagId),
				}));

				return { ...invoice, lines: linesWithTags };
			}),
		);

		return invoicesWithLines;
	})
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
				JSON.stringify({
					error: "Invalid query parameters",
					details: parsed.error.flatten(),
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		const { page, limit, search, sort, order } = parsed.data;
		const offset = (page - 1) * limit;

		const conditions = [];
		if (search) {
			const dateStr = sql`strftime('%Y-%m-%d', ${invoices.invoiceDate} / 1000, 'unixepoch')`;
			conditions.push(
				or(
					like(invoices.invoiceNumber, `%${search}%`),
					like(suppliers.name, `%${search}%`),
					like(dateStr, `%${search}%`),
				),
			);
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;
		const orderFn = order === "desc" ? desc : asc;

		let orderExpression: ReturnType<typeof asc> | ReturnType<typeof desc>;
		if (sort === "supplierName") {
			orderExpression = orderFn(suppliers.name);
		} else {
			orderExpression = orderFn(invoices[sort]);
		}

		const baseQuery = db
			.select()
			.from(invoices)
			.leftJoin(suppliers, eq(invoices.supplierId, suppliers.id))
			.where(where);

		const countQuery = db
			.select({ value: count() })
			.from(invoices)
			.leftJoin(suppliers, eq(invoices.supplierId, suppliers.id))
			.where(where);

		const [dataResult, totalResult] = await Promise.all([
			baseQuery.orderBy(orderExpression).limit(limit).offset(offset),
			countQuery,
		]);

		const total = totalResult[0]?.value ?? 0;

		const invoicesWithLines = await Promise.all(
			dataResult.map(async (row) => {
				const invoice = row.invoices;
				const lines = await db
					.select()
					.from(invoiceLines)
					.where(eq(invoiceLines.invoiceId, invoice.id));

				const allLineTags = await getLinesWithTags(lines);
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

		return {
			data: invoicesWithLines,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	})
	.get("/:id", async ({ request, params }) => {
		const userId = await getSessionUserId(request);
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const id = Number(params.id);
		if (Number.isNaN(id)) {
			return new Response(JSON.stringify({ error: "Invalid ID" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const existing = await db
			.select()
			.from(invoices)
			.where(eq(invoices.id, id))
			.limit(1);

		if (existing.length === 0) {
			return new Response(JSON.stringify({ error: "Invoice not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const lines = await db
			.select()
			.from(invoiceLines)
			.where(eq(invoiceLines.invoiceId, id));

		const allLineTags = await getLinesWithTags(lines);
		const linesWithTags = lines.map((line) => ({
			...line,
			tag_ids: allLineTags
				.filter((lt) => lt.invoiceLineId === line.id)
				.map((lt) => lt.tagId),
		}));

		return { ...existing[0], lines: linesWithTags };
	})
	.post("/", async ({ request, body }) => {
		const userId = await getSessionUserId(request);
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const parsed = createInvoiceSchema.safeParse(body);
		if (!parsed.success) {
			return new Response(
				JSON.stringify({
					error: "Validation failed",
					details: parsed.error.flatten(),
				}),
				{ status: 422, headers: { "Content-Type": "application/json" } },
			);
		}

		const { supplier_id, branch_id, invoice_date, invoice_number, lines } =
			parsed.data;

		const existing = await db
			.select({ id: invoices.id })
			.from(invoices)
			.where(eq(invoices.invoiceNumber, invoice_number))
			.limit(1);

		if (existing.length > 0) {
			return new Response(
				JSON.stringify({ error: "An invoice with this number already exists" }),
				{ status: 409, headers: { "Content-Type": "application/json" } },
			);
		}

		const now = new Date();
		const invoiceDate = new Date(invoice_date);

		const [created] = await db
			.insert(invoices)
			.values({
				supplierId: supplier_id,
				branchId: branch_id,
				invoiceDate: invoiceDate,
				invoiceNumber: invoice_number,
				createdBy: userId,
				createdAt: now,
				updatedBy: userId,
				updatedAt: now,
			})
			.returning();

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

		return { ...created, lines: createdLines };
	})
	.patch("/:id", async ({ request, params, body }) => {
		const userId = await getSessionUserId(request);
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const parsed = updateInvoiceSchema.safeParse(body);
		if (!parsed.success) {
			return new Response(
				JSON.stringify({
					error: "Validation failed",
					details: parsed.error.flatten(),
				}),
				{ status: 422, headers: { "Content-Type": "application/json" } },
			);
		}

		const id = Number(params.id);
		if (Number.isNaN(id)) {
			return new Response(JSON.stringify({ error: "Invalid ID" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const existing = await db
			.select()
			.from(invoices)
			.where(eq(invoices.id, id))
			.limit(1);

		if (existing.length === 0) {
			return new Response(JSON.stringify({ error: "Invoice not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const { supplier_id, branch_id, invoice_date, invoice_number, lines } =
			parsed.data;

		if (invoice_number && invoice_number !== existing[0].invoiceNumber) {
			const numberTaken = await db
				.select({ id: invoices.id })
				.from(invoices)
				.where(eq(invoices.invoiceNumber, invoice_number))
				.limit(1);

			if (numberTaken.length > 0) {
				return new Response(
					JSON.stringify({
						error: "An invoice with this number already exists",
					}),
					{ status: 409, headers: { "Content-Type": "application/json" } },
				);
			}
		}

		const now = new Date();

		await db
			.update(invoices)
			.set({
				...(supplier_id !== undefined && { supplierId: supplier_id }),
				...(branch_id !== undefined && { branchId: branch_id }),
				...(invoice_date !== undefined && {
					invoiceDate: new Date(invoice_date),
				}),
				...(invoice_number !== undefined && { invoiceNumber: invoice_number }),
				updatedBy: userId,
				updatedAt: now,
			})
			.where(eq(invoices.id, id));

		if (lines !== undefined) {
			// Delete existing tag associations for lines being replaced
			const existingLineIds = await db
				.select({ id: invoiceLines.id })
				.from(invoiceLines)
				.where(eq(invoiceLines.invoiceId, id));

			if (existingLineIds.length > 0) {
				const ids = existingLineIds.map((l) => l.id);
				await db
					.delete(invoiceLineTags)
					.where(inArray(invoiceLineTags.invoiceLineId, ids));
			}

			// Delete existing lines
			await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, id));

			// Re-insert lines with tags
			await Promise.all(
				lines.map(async (line) => {
					const startDate = new Date(line.start_date);
					const endDate = line.end_date ? new Date(line.end_date) : startDate;
					const [createdLine] = await db
						.insert(invoiceLines)
						.values({
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
				}),
			);
		}

		const updated = await db
			.select()
			.from(invoices)
			.where(eq(invoices.id, id))
			.limit(1);

		const updatedLines = await db
			.select()
			.from(invoiceLines)
			.where(eq(invoiceLines.invoiceId, id));

		const allLineTags = await getLinesWithTags(updatedLines);
		const linesWithTags = updatedLines.map((line) => ({
			...line,
			tag_ids: allLineTags
				.filter((lt) => lt.invoiceLineId === line.id)
				.map((lt) => lt.tagId),
		}));

		return { ...updated[0], lines: linesWithTags };
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
			return new Response(JSON.stringify({ error: "Invalid ID" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const existing = await db
			.select()
			.from(invoices)
			.where(eq(invoices.id, id))
			.limit(1);

		if (existing.length === 0) {
			return new Response(JSON.stringify({ error: "Invoice not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, id));
		await db.delete(invoices).where(eq(invoices.id, id));

		return { success: true };
	});

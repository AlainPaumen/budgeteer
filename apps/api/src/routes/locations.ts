import { and, asc, count, desc, eq, like } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod";
import { auth } from "../auth";
import { db } from "../db";
import { locations } from "../db/schema";

const createLocationSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	notes: z.string().max(1000).nullable().optional(),
});

const updateLocationSchema = z.object({
	name: z.string().min(1, "Name is required").max(255).optional(),
	notes: z.string().max(1000).nullable().optional(),
	is_active: z.coerce.boolean().optional(),
});

const listQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20),
	search: z.string().optional(),
	is_active: z.coerce.boolean().optional(),
	sort: z.enum(["name"]).default("name"),
	order: z.enum(["asc", "desc"]).default("asc"),
});

async function getSessionUserId(request: Request): Promise<string | null> {
	const session = await auth.api.getSession({
		headers: request.headers,
	});
	return session?.user?.id ?? null;
}

export const locationRoutes = new Elysia({ prefix: "/api/locations" })
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

		const { page, limit, search, is_active, sort, order } = parsed.data;
		const offset = (page - 1) * limit;

		const conditions = [];
		if (is_active !== undefined) {
			conditions.push(eq(locations.isActive, is_active));
		}
		if (search) {
			conditions.push(like(locations.name, `%${search}%`));
		}

		const where = and(...conditions);
		const orderFn = order === "desc" ? desc : asc;

		const [data, totalResult] = await Promise.all([
			db
				.select()
				.from(locations)
				.where(where)
				.orderBy(orderFn(locations[sort]))
				.limit(limit)
				.offset(offset),
			db.select({ value: count() }).from(locations).where(where),
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

		const parsed = createLocationSchema.safeParse(body);
		if (!parsed.success) {
			return new Response(
				JSON.stringify({
					error: "Validation failed",
					details: parsed.error.flatten(),
				}),
				{ status: 422, headers: { "Content-Type": "application/json" } },
			);
		}

		const { name, notes } = parsed.data;

		const existing = await db
			.select({ id: locations.id })
			.from(locations)
			.where(and(eq(locations.name, name), eq(locations.isActive, true)))
			.limit(1);

		if (existing.length > 0) {
			return new Response(
				JSON.stringify({ error: "A location with this name already exists" }),
				{ status: 409, headers: { "Content-Type": "application/json" } },
			);
		}

		const now = new Date();
		const [created] = await db
			.insert(locations)
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

		const parsed = updateLocationSchema.safeParse(body);
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
			.from(locations)
			.where(eq(locations.id, id))
			.limit(1);

		if (existing.length === 0) {
			return new Response(JSON.stringify({ error: "Location not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const { name, notes, is_active } = parsed.data;

		if (name && name !== existing[0].name) {
			const nameTaken = await db
				.select({ id: locations.id })
				.from(locations)
				.where(and(eq(locations.name, name), eq(locations.isActive, true)))
				.limit(1);

			if (nameTaken.length > 0) {
				return new Response(
					JSON.stringify({ error: "A location with this name already exists" }),
					{ status: 409, headers: { "Content-Type": "application/json" } },
				);
			}
		}

		const [updated] = await db
			.update(locations)
			.set({
				...(name !== undefined && { name }),
				...(notes !== undefined && { notes: notes ?? null }),
				...(is_active !== undefined && { isActive: is_active }),
				updatedBy: userId,
				updatedAt: new Date(),
			})
			.where(eq(locations.id, id))
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
			return new Response(JSON.stringify({ error: "Invalid ID" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const existing = await db
			.select()
			.from(locations)
			.where(and(eq(locations.id, id), eq(locations.isActive, true)))
			.limit(1);

		if (existing.length === 0) {
			return new Response(JSON.stringify({ error: "Location not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		await db
			.update(locations)
			.set({
				isActive: false,
				updatedBy: userId,
				updatedAt: new Date(),
			})
			.where(eq(locations.id, id));

		return { success: true };
	});

import { and, asc, eq, or, sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod";
import { auth } from "../auth";
import { db } from "../db";
import { categories, invoiceLines, invoices, services } from "../db/schema";

const listQuerySchema = z.object({
	year: z.coerce.number(),
	branch_id: z.coerce.number().optional(),
	supplier_id: z.coerce.number().optional(),
	cost_type_id: z.coerce.number().optional(),
});

async function getSessionUserId(request: Request): Promise<string | null> {
	const session = await auth.api.getSession({
		headers: request.headers,
	});
	return session?.user?.id ?? null;
}

interface PivotService {
	serviceId: number;
	serviceName: string;
	categories: PivotCategory[];
	total: number;
}

interface PivotCategory {
	categoryId: number;
	categoryName: string;
	months: number[];
	total: number;
}

interface PivotData {
	year: number;
	services: PivotService[];
	grandTotal: number[];
	grandTotalSum: number;
}

export const reportRoutes = new Elysia()
	.get(
		"/api/reports/expenses",
		async ({ request, query }) => {
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

			const { year, branch_id, supplier_id, cost_type_id } = parsed.data;

			const startOfYear = Date.UTC(year, 0, 1);
			const endOfYear = Date.UTC(year + 1, 0, 0);

			const conditions = [
				and(
					or(
						and(
							gte(invoiceLines.startDate, startOfYear),
							lte(invoiceLines.startDate, endOfYear),
						),
						and(
							gte(invoiceLines.endDate, startOfYear),
							lte(invoiceLines.endDate, endOfYear),
						),
						and(
							lte(invoiceLines.startDate, startOfYear),
							gte(invoiceLines.endDate, endOfYear),
						),
					),
				),
			];

			if (branch_id) {
				conditions.push(and(eq(invoices.branchId, Number(branch_id))));
			}
			if (supplier_id) {
				conditions.push(and(eq(invoices.supplierId, Number(supplier_id))));
			}
			if (cost_type_id) {
				conditions.push(and(eq(invoiceLines.costTypeId, Number(cost_type_id))));
			}

			const where = conditions.length > 0 ? and(...conditions) : undefined;

			const invoiceLinesDataRaw = await db
				.select({
					id: invoiceLines.id,
					totalAmount: invoiceLines.totalAmount,
					startDate: invoiceLines.startDate,
					endDate: invoiceLines.endDate,
					serviceId: invoiceLines.serviceId,
					serviceName: services.name,
					categoryId: invoiceLines.categoryId,
					categoryName: categories.name,
				})
				.from(invoiceLines)
				.leftJoin(invoices, eq(invoiceLines.invoiceId, invoices.id))
				.leftJoin(services, eq(invoiceLines.serviceId, services.id))
				.leftJoin(categories, eq(invoiceLines.categoryId, categories.id))
				.where(
					and(
						where,
						eq(services.isActive, true),
						eq(categories.isActive, true),
					),
				)
				.orderBy(asc(services.name), asc(categories.name));

			const invoiceLinesData = invoiceLinesDataRaw.map((row) => ({
				...row,
				startDate: row.startDate.getTime(),
				endDate: row.endDate.getTime(),
			}));

			const pivotData = computePivotData(invoiceLinesData, year);

			return pivotData;
		},
		{
			query: z.object({
				year: z.coerce.number(),
				branch_id: z.coerce.number().optional(),
				supplier_id: z.coerce.number().optional(),
				cost_type_id: z.coerce.number().optional(),
			}),
		},
	)
	.get(
		"/api/reports/expenses/debug",
		async ({ request, query }) => {
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

			const { year, branch_id, supplier_id, cost_type_id } = parsed.data;

			const startOfYear = Date.UTC(year, 0, 1);
			const endOfYear = Date.UTC(year + 1, 0, 0);

			const conditions = [
				and(
					or(
						and(
							gte(invoiceLines.startDate, startOfYear),
							lte(invoiceLines.startDate, endOfYear),
						),
						and(
							gte(invoiceLines.endDate, startOfYear),
							lte(invoiceLines.endDate, endOfYear),
						),
						and(
							lte(invoiceLines.startDate, startOfYear),
							gte(invoiceLines.endDate, endOfYear),
						),
					),
				),
			];

			if (branch_id) {
				conditions.push(and(eq(invoices.branchId, Number(branch_id))));
			}
			if (supplier_id) {
				conditions.push(and(eq(invoices.supplierId, Number(supplier_id))));
			}
			if (cost_type_id) {
				conditions.push(and(eq(invoiceLines.costTypeId, Number(cost_type_id))));
			}

			const where = conditions.length > 0 ? and(...conditions) : undefined;

			const invoiceLinesDataRaw = await db
				.select({
					id: invoiceLines.id,
					totalAmount: invoiceLines.totalAmount,
					startDate: invoiceLines.startDate,
					endDate: invoiceLines.endDate,
					serviceId: invoiceLines.serviceId,
					serviceName: services.name,
					categoryId: invoiceLines.categoryId,
					categoryName: categories.name,
				})
				.from(invoiceLines)
				.leftJoin(invoices, eq(invoiceLines.invoiceId, invoices.id))
				.leftJoin(services, eq(invoiceLines.serviceId, services.id))
				.leftJoin(categories, eq(invoiceLines.categoryId, categories.id))
				.where(
					and(
						where,
						eq(services.isActive, true),
						eq(categories.isActive, true),
					),
				)
				.orderBy(
					asc(invoiceLines.endDate),
					asc(services.name),
					asc(categories.name),
				);

			const invoiceLinesData = invoiceLinesDataRaw.map((row) => ({
				...row,
				startDate: row.startDate.getTime(),
				endDate: row.endDate.getTime(),
			}));

			return invoiceLinesData;
		},
		{
			query: z.object({
				year: z.coerce.number(),
				branch_id: z.coerce.number().optional(),
				supplier_id: z.coerce.number().optional(),
				cost_type_id: z.coerce.number().optional(),
			}),
		},
	);

interface PivotLine {
	id: number;
	totalAmount: number;
	startDate: number;
	endDate: number;
	serviceId: number;
	serviceName: string | null;
	categoryId: number;
	categoryName: string | null;
}

function computePivotData(lines: PivotLine[], _year: number): PivotData {
	const months = Array.from({ length: 12 }, (_, i) => i);

	const servicesMap = new Map<
		number,
		{
			serviceName: string;
			categories: Map<number, { categoryName: string; months: number[] }>;
		}
	>();

	for (const line of lines) {
		if (line.serviceName && !servicesMap.has(line.serviceId)) {
			servicesMap.set(line.serviceId, {
				serviceName: line.serviceName,
				categories: new Map(),
			});
		}

		const service = servicesMap.get(line.serviceId);
		if (!service) {
			if (line.serviceName) {
				servicesMap.set(line.serviceId, {
					serviceName: line.serviceName,
					categories: new Map(),
				});
			}
			continue;
		}
		if (line.categoryName && !service.categories.has(line.categoryId)) {
			service.categories.set(line.categoryId, {
				categoryName: line.categoryName,
				months: Array(12).fill(0),
			});
		}

		const category = service.categories.get(line.categoryId);
		if (!category) continue;
		proRateAmount(
			line.totalAmount,
			line.startDate,
			line.endDate,
			category.months,
			_year,
		);
	}

	const servicesList: PivotService[] = [];
	for (const [serviceId, service] of servicesMap.entries()) {
		const categoriesList: PivotCategory[] = [];
		for (const [categoryId, cat] of service.categories.entries()) {
			const total = cat.months.reduce((sum, val) => sum + val, 0);
			categoriesList.push({
				categoryId,
				categoryName: cat.categoryName,
				months: cat.months,
				total,
			});
		}

		const serviceTotal = categoriesList.reduce(
			(sum, cat) => sum + cat.total,
			0,
		);

		servicesList.push({
			serviceId,
			serviceName: service.serviceName,
			categories: categoriesList,
			total: serviceTotal,
		});
	}

	const grandTotal = months.map((month) =>
		servicesList.reduce((sum, service) => {
			let serviceMonthTotal = 0;
			for (const cat of service.categories) {
				serviceMonthTotal += cat.months[month];
			}
			return sum + serviceMonthTotal;
		}, 0),
	);

	return {
		year: _year,
		services: servicesList,
		grandTotal,
		grandTotalSum: grandTotal.reduce((sum, val) => sum + val, 0),
	};
}

function proRateAmount(
	totalAmount: number,
	startDate: number,
	endDate: number,
	months: number[],
	_year: number,
) {
	const start = new Date(startDate);
	const end = new Date(endDate);

	if (start.getFullYear() > _year || end.getFullYear() < _year) {
		return;
	}

	const yearStart = new Date(_year, 0, 1);
	const yearEnd = new Date(_year, 11, 31, 23, 59, 59, 999);

	const adjustedStart = new Date(
		Math.max(start.getTime(), yearStart.getTime()),
	);
	const adjustedEnd = new Date(Math.min(end.getTime(), yearEnd.getTime()));

	const sameDay =
		adjustedStart.getFullYear() === adjustedEnd.getFullYear() &&
		adjustedStart.getMonth() === adjustedEnd.getMonth() &&
		adjustedStart.getDate() === adjustedEnd.getDate();

	if (sameDay) {
		const month = adjustedStart.getMonth();
		if (month >= 0 && month < 12) {
			months[month] += totalAmount / 10000;
		}
		return;
	}

	let current = new Date(adjustedStart);
	const endOfMonth = new Date(adjustedEnd);

	let totalMonths = 0;

	while (current <= endOfMonth) {
		totalMonths++;
		current = addRollingMonth(current);
	}

	if (totalMonths === 0) return;

	const monthlyAmount = totalAmount / totalMonths;

	current = new Date(adjustedStart);
	while (current <= endOfMonth) {
		const month = current.getMonth();
		if (month >= 0 && month < 12) {
			months[month] += monthlyAmount / 10000;
		}
		current = addRollingMonth(current);
	}
}

function addRollingMonth(date: Date): Date {
	const year = date.getFullYear();
	const month = date.getMonth();
	const day = date.getDate();

	const newMonth = month + 1;
	if (newMonth > 11) {
		return new Date(year + 1, 0, day);
	}

	return new Date(year, newMonth, day);
}

function gte(field: unknown, value: number) {
	return sql`${field} >= ${value}`;
}

function lte(field: unknown, value: number) {
	return sql`${field} <= ${value}`;
}

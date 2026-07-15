import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" })
		.default(false)
		.notNull(),
	image: text("image"),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.$onUpdate(() => new Date())
		.notNull(),
});

export const session = sqliteTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		token: text("token").notNull().unique(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$onUpdate(() => new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: integer("access_token_expires_at", {
			mode: "timestamp_ms",
		}),
		refreshTokenExpiresAt: integer("refresh_token_expires_at", {
			mode: "timestamp_ms",
		}),
		scope: text("scope"),
		password: text("password"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

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

export const locations = sqliteTable("locations", {
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

export const locationRelations = relations(locations, ({ one }) => ({
	createdByUser: one(user, {
		fields: [locations.createdBy],
		references: [user.id],
	}),
	updatedByUser: one(user, {
		fields: [locations.updatedBy],
		references: [user.id],
	}),
}));

export const branches = sqliteTable("branches", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	notes: text("notes"),
	locationId: integer("location_id").references(() => locations.id),
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

export const branchRelations = relations(branches, ({ one }) => ({
	createdByUser: one(user, {
		fields: [branches.createdBy],
		references: [user.id],
	}),
	updatedByUser: one(user, {
		fields: [branches.updatedBy],
		references: [user.id],
	}),
	location: one(locations, {
		fields: [branches.locationId],
		references: [locations.id],
	}),
}));

export const services = sqliteTable("services", {
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

export const serviceRelations = relations(services, ({ one }) => ({
	createdByUser: one(user, {
		fields: [services.createdBy],
		references: [user.id],
	}),
	updatedByUser: one(user, {
		fields: [services.updatedBy],
		references: [user.id],
	}),
}));

export const costTypes = sqliteTable("cost_types", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	notes: text("notes"),
	isFixed: integer("is_fixed", { mode: "boolean" }).default(true).notNull(),
	isCapex: integer("is_capex", { mode: "boolean" }).default(false).notNull(),
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

export const costTypeRelations = relations(costTypes, ({ one }) => ({
	createdByUser: one(user, {
		fields: [costTypes.createdBy],
		references: [user.id],
	}),
	updatedByUser: one(user, {
		fields: [costTypes.updatedBy],
		references: [user.id],
	}),
}));

export const categories = sqliteTable("categories", {
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

export const categoryRelations = relations(categories, ({ one }) => ({
	createdByUser: one(user, {
		fields: [categories.createdBy],
		references: [user.id],
	}),
	updatedByUser: one(user, {
		fields: [categories.updatedBy],
		references: [user.id],
	}),
}));

export const invoices = sqliteTable("invoices", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	supplierId: integer("supplier_id")
		.notNull()
		.references(() => suppliers.id),
	invoiceDate: integer("invoice_date", { mode: "timestamp_ms" }).notNull(),
	invoiceNumber: text("invoice_number").notNull().unique(),
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

export const invoiceRelations = relations(invoices, ({ one, many }) => ({
	supplier: one(suppliers, {
		fields: [invoices.supplierId],
		references: [suppliers.id],
	}),
	createdByUser: one(user, {
		fields: [invoices.createdBy],
		references: [user.id],
	}),
	updatedByUser: one(user, {
		fields: [invoices.updatedBy],
		references: [user.id],
	}),
	lines: many(invoiceLines),
}));

export const invoiceLines = sqliteTable("invoice_lines", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	invoiceId: integer("invoice_id")
		.notNull()
		.references(() => invoices.id, { onDelete: "cascade" }),
	description: text("description").notNull(),
	unitPrice: integer("unit_price").notNull(),
	numberOfUnits: integer("number_of_units").notNull(),
	totalAmount: integer("total_amount").notNull(),
	startDate: integer("start_date", { mode: "timestamp_ms" }).notNull(),
	endDate: integer("end_date", { mode: "timestamp_ms" }).notNull(),
	serviceId: integer("service_id")
		.notNull()
		.references(() => services.id),
	categoryId: integer("category_id")
		.notNull()
		.references(() => categories.id),
	costTypeId: integer("cost_type_id")
		.notNull()
		.references(() => costTypes.id),
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

export const invoiceLineRelations = relations(invoiceLines, ({ one }) => ({
	invoice: one(invoices, {
		fields: [invoiceLines.invoiceId],
		references: [invoices.id],
	}),
	service: one(services, {
		fields: [invoiceLines.serviceId],
		references: [services.id],
	}),
	category: one(categories, {
		fields: [invoiceLines.categoryId],
		references: [categories.id],
	}),
	costType: one(costTypes, {
		fields: [invoiceLines.costTypeId],
		references: [costTypes.id],
	}),
	createdByUser: one(user, {
		fields: [invoiceLines.createdBy],
		references: [user.id],
	}),
	updatedByUser: one(user, {
		fields: [invoiceLines.updatedBy],
		references: [user.id],
	}),
}));

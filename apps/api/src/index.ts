import { runMigrations } from "./migrate";

// Run migrations BEFORE importing db/auth (which connect to the DB)
runMigrations("./data/budgeteer.db");

import { readFileSync } from "node:fs";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import { auth } from "./auth";
import { branchRoutes } from "./routes/branches";
import { categoryRoutes } from "./routes/categories";
import { costTypeRoutes } from "./routes/cost-types";
import { invoiceRoutes } from "./routes/invoices";
import { locationRoutes } from "./routes/locations";
import { serviceRoutes } from "./routes/services";
import { supplierRoutes } from "./routes/suppliers";
import { tagRoutes } from "./routes/tags";

const PORT = Number(process.env.PORT) || 3000;

const ALLOWED_ORIGINS = [
	process.env.FRONTEND_URL,
	"http://localhost:5173",
	"http://localhost:5174",
].filter((x): x is string => !!x);

const isProduction = process.env.NODE_ENV === "production";

const app = new Elysia()
	.use(
		cors({
			origin: ALLOWED_ORIGINS,
			methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			credentials: true,
			allowedHeaders: ["Content-Type", "Authorization"],
		}),
	)
	.all("/api/auth/*", ({ request }) => auth.handler(request))
	.use(supplierRoutes)
	.use(tagRoutes)
	.use(branchRoutes)
	.use(locationRoutes)
	.use(serviceRoutes)
	.use(costTypeRoutes)
	.use(categoryRoutes)
	.use(invoiceRoutes)
	.get("/api/health", () => ({
		status: "ok",
		timestamp: new Date().toISOString(),
	}));

if (!isProduction) {
	app
		.get("/api/debug/env", () => ({
			BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
			BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? "set" : "missing",
			NODE_ENV: process.env.NODE_ENV,
			PORT: process.env.PORT,
		}))
		.get("/api/debug/sessions", async () => {
			const { Database } = await import("bun:sqlite");
			const sqlite = new Database("./data/budgeteer.db");
			const sessions = sqlite
				.query(
					"SELECT id, token, user_id, expires_at FROM session ORDER BY created_at DESC LIMIT 5",
				)
				.all();
			const users = sqlite.query("SELECT id, email, name FROM user").all();
			sqlite.close();
			return { sessions, users };
		});
}

if (isProduction) {
	app.use(
		staticPlugin({
			assets: "./public",
			prefix: "/",
			indexHTML: true,
			silent: true,
		}),
	);
	app.get("/*", ({ path }) => {
		if (path.startsWith("/api")) return;
		try {
			const html = readFileSync("./public/index.html", "utf-8");
			return new Response(html, {
				headers: { "Content-Type": "text/html" },
			});
		} catch {
			return new Response("Not Found", { status: 404 });
		}
	});
}

app.listen(PORT);

console.log(`Elysia server running at http://localhost:${app.server?.port}`);

export type App = typeof app;

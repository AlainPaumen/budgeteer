import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { auth } from "./auth";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const app = new Elysia()
	.use(
		cors({
			origin: FRONTEND_URL,
			methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
			credentials: true,
			allowedHeaders: ["Content-Type", "Authorization"],
		}),
	)
	.mount(auth.handler)
	.get("/api/health", () => ({
		status: "ok",
		timestamp: new Date().toISOString(),
	}))
	.listen(3000);

console.log(`Elysia server running at http://localhost:${app.server?.port}`);

export type App = typeof app;

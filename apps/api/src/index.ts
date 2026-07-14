import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { auth } from "./auth";
import { costTypeRoutes } from "./routes/cost-types";
import { serviceRoutes } from "./routes/services";
import { supplierRoutes } from "./routes/suppliers";

const ALLOWED_ORIGINS = [
	process.env.FRONTEND_URL,
	"http://localhost:5173",
	"http://localhost:5174",
].filter((x): x is string => !!x);

const app = new Elysia()
	.use(
		cors({
			origin: ALLOWED_ORIGINS,
			methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			credentials: true,
			allowedHeaders: ["Content-Type", "Authorization"],
		}),
	)
	.mount(auth.handler)
	.use(supplierRoutes)
	.use(serviceRoutes)
	.use(costTypeRoutes)
	.get("/api/health", () => ({
		status: "ok",
		timestamp: new Date().toISOString(),
	}))
	.listen(3000);

console.log(`Elysia server running at http://localhost:${app.server?.port}`);

export type App = typeof app;

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { db } from "./db";

const TRUSTED_ORIGINS = [
	process.env.FRONTEND_URL,
	"http://localhost:5173",
	"http://localhost:5174",
].filter((x): x is string => !!x);

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "sqlite" }),
	emailAndPassword: { enabled: true },
	trustedOrigins: TRUSTED_ORIGINS,
	secret: process.env.BETTER_AUTH_SECRET || "dev-secret-change-in-production",
});

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { db } from "./db";

const isProduction = process.env.NODE_ENV === "production";

const TRUSTED_ORIGINS = [
	process.env.FRONTEND_URL,
	"http://localhost:5173",
	"http://localhost:5174",
].filter((x): x is string => !!x);

export const auth = betterAuth({
	baseURL:
		process.env.BETTER_AUTH_URL ||
		`http://localhost:${process.env.PORT || 3000}`,
	database: drizzleAdapter(db, { provider: "sqlite" }),
	emailAndPassword: { enabled: true },
	trustedOrigins: TRUSTED_ORIGINS,
	secret: process.env.BETTER_AUTH_SECRET,
	rateLimit: {
		window: 60,
		max: 100,
	},
	advanced: {
		useSecureCookies: isProduction,
		...(isProduction && {
			ipAddress: {
				ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
				trustedProxies: ["172.16.0.0/12", "192.168.0.0/16", "10.0.0.0/8"],
			},
		}),
	},
});

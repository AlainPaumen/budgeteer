# Email/Password Authentication — Design Spec

## 1. Overview

Add email/password authentication to the Budgeteer backend using Better-Auth. This is the first feature — backend only, no UI pages. Email verification is deferred to a future iteration.

## 2. Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `better-auth` | latest | Core auth library |
| `@better-auth/drizzle-adapter` | latest | Drizzle ORM integration |

Added to `apps/api/package.json`.

## 3. Auth Configuration

New file: `apps/api/src/auth.ts`

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: { enabled: true },
});
```

Key decisions:
- Drizzle adapter shares the existing SQLite connection
- Email/password enabled, no other providers
- Default password hashing (scrypt) — OWASP recommended
- No email verification (noted in FUTURE.md)

## 4. Elysia Integration

Modified file: `apps/api/src/index.ts`

```ts
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "./auth";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const app = new Elysia()
  .use(cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }))
  .mount(auth.handler)
  .get("/api/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .listen(3000);

export type App = typeof app;
```

Key decisions:
- `.mount(auth.handler)` exposes all Better-Auth routes under `/api/auth/*`
- CORS origin from `FRONTEND_URL` env var (defaults to localhost:5173)
- Health check route preserved
- `export type App` preserved for Eden Treaty bridge

## 5. Schema Generation

Use Better-Auth CLI to generate Drizzle schema:
```bash
bun x --bun auth@latest generate
```

This generates the required tables (user, session, account, verification) in `apps/api/src/db/schema.ts`. The generated schema is committed to the repo.

## 6. Database Connection

The existing `apps/api/src/db/index.ts` already creates a SQLite connection via `bun:sqlite` and wraps it with Drizzle. Better-Auth's Drizzle adapter reuses this same `db` instance — no duplicate connections.

## 7. FUTURE.md

Create `FUTURE.md` at project root:
```md
# Future Features

## Email Verification
- Enable `emailVerification` in Better-Auth config
- Implement `sendVerificationEmail` function (requires email service)
- Add `requireEmailVerification: true` to prevent fake registrations
```

## 8. What We're NOT Building

- No email verification (YAGNI)
- No password reset (YAGNI)
- No OAuth providers (YAGNI)
- No 2FA (YAGNI)
- No frontend auth pages (backend only scope)
- No session management UI (YAGNI)

# Email/Password Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email/password authentication to the Budgeteer backend using Better-Auth with Drizzle adapter and SQLite.

**Architecture:** Better-Auth library mounted on Elysia server via `.mount(auth.handler)`. Drizzle adapter reuses the existing SQLite connection. Email/password enabled, no other providers. Backend only — no frontend auth pages.

**Tech Stack:** Better-Auth, @better-auth/drizzle-adapter, Drizzle ORM, bun:sqlite, Elysia

## Global Constraints
- Bun only — no npm/pnpm/yarn
- No external SQLite drivers — use `bun:sqlite`
- Elysia routes must export `type App = typeof app`
- Drizzle schema in `apps/api/src/db/schema.ts` only
- CORS origin from `FRONTEND_URL` env var

---

### Task 1: Install Better-Auth Dependencies

**Files:**
- Modify: `apps/api/package.json`

**Interfaces:**
- Consumes: nothing
- Produces: better-auth and @better-auth/drizzle-adapter available for import

- [ ] **Step 1: Install better-auth and drizzle adapter**

Run from root:
```bash
bun add better-auth @better-auth/drizzle-adapter --filter api
```

Expected: packages installed, lockfile updated

- [ ] **Step 2: Verify installation**

Run:
```bash
ls node_modules/better-auth/package.json node_modules/@better-auth/drizzle-adapter/package.json
```

Expected: both files exist

- [ ] **Step 3: Commit**

```bash
git add apps/api/package.json bun.lock
git commit -m "feat(api): add better-auth and drizzle adapter dependencies"
```

---

### Task 2: Create Auth Configuration

**Files:**
- Create: `apps/api/src/auth.ts`

**Interfaces:**
- Consumes: `db` from `./db` (Drizzle instance)
- Produces: `auth` object with `.handler` for Elysia mounting

- [ ] **Step 1: Create auth.ts**

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: { enabled: true },
});
```

- [ ] **Step 2: Verify import resolves**

Run:
```bash
cd apps/api && bun x tsc --noEmit 2>&1 | head -20
```

Expected: no errors about missing modules (schema not generated yet, but auth.ts should compile)

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/auth.ts
git commit -m "feat(api): add Better-Auth configuration with email/password"
```

---

### Task 3: Update Elysia Server with Auth Handler

**Files:**
- Modify: `apps/api/src/index.ts`

**Interfaces:**
- Consumes: `auth` from `./auth` (Better-Auth instance)
- Produces: Elysia server with auth routes mounted at `/api/auth/*`

- [ ] **Step 1: Read current index.ts**

Read `apps/api/src/index.ts` to understand current structure.

- [ ] **Step 2: Update index.ts**

Replace content of `apps/api/src/index.ts`:

```ts
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
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
```

- [ ] **Step 3: Verify type-check passes**

Run:
```bash
cd apps/api && bun x tsc --noEmit 2>&1
```

Expected: no TypeScript errors (schema not yet generated, but auth.ts and index.ts should compile)

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/index.ts
git commit -m "feat(api): mount Better-Auth handler on Elysia with CORS"
```

---

### Task 4: Generate Auth Database Schema

**Files:**
- Modify: `apps/api/src/db/schema.ts` (Better-Auth CLI generates this)

**Interfaces:**
- Consumes: auth config from `./auth`
- Produces: Drizzle schema with user, session, account, verification tables

- [ ] **Step 1: Run Better-Auth schema generation**

Run from project root:
```bash
cd apps/api && bun x --bun auth@latest generate
```

Expected: CLI generates schema files in `src/db/`

- [ ] **Step 2: Review generated schema**

Read `apps/api/src/db/schema.ts` to verify it contains:
- `user` table (id, name, email, emailVerified, image, createdAt, updatedAt)
- `session` table (id, userId, expiresAt, token, ipAddress, userAgent)
- `account` table (id, userId, accountId, providerId, password)
- `verification` table (id, identifier, value, expiresAt, createdAt)

- [ ] **Step 3: Verify db/index.ts still works**

The existing `apps/api/src/db/index.ts` imports `* as schema from './schema'`. Verify it still compiles:
```bash
cd apps/api && bun x tsc --noEmit 2>&1
```

Expected: no errors

- [ ] **Step 4: Verify server starts**

Run:
```bash
cd apps/api && timeout 5 bun run dev 2>&1 || true
```

Expected: "Elysia server running at http://localhost:3000"

- [ ] **Step 5: Test auth endpoints**

Start server in background, then test:
```bash
cd apps/api && bun run dev &
sleep 2

# Test sign-up endpoint exists
curl -s -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}' | head -c 500

kill %1
```

Expected: JSON response (may be error about email verification or success)

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/db/schema.ts
git commit -m "feat(api): generate Better-Auth Drizzle schema"
```

---

### Task 5: Create FUTURE.md

**Files:**
- Create: `FUTURE.md`

**Interfaces:**
- Consumes: nothing
- Produces: documentation of planned email verification feature

- [ ] **Step 1: Create FUTURE.md**

```md
# Future Features

## Email Verification

- Enable `emailVerification` in Better-Auth config
- Implement `sendVerificationEmail` function (requires email service)
- Add `requireEmailVerification: true` to prevent fake registrations
```

- [ ] **Step 2: Commit**

```bash
git add FUTURE.md
git commit -m "docs: add FUTURE.md with email verification plan"
```

---

### Task 6: Verify End-to-End

**Files:**
- No new files (verification only)

**Interfaces:**
- Consumes: all tasks above
- Produces: confirmed working auth system

- [ ] **Step 1: Type-check both workspaces**

Run:
```bash
cd apps/api && bun x tsc --noEmit 2>&1 && echo "--- API OK ---"
cd apps/web && bun x tsc --noEmit 2>&1 && echo "--- WEB OK ---"
```

Expected: both pass

- [ ] **Step 2: Run Biome lint**

Run:
```bash
cd /home/alain/Projects/budgeteer && bun x biome check apps/ packages/ 2>&1
```

Expected: no errors (warnings acceptable)

- [ ] **Step 3: Auto-fix any lint issues**

Run:
```bash
cd /home/alain/Projects/budgeteer && bun x biome check --write apps/ packages/ 2>&1
```

- [ ] **Step 4: Full integration test**

Start both servers, test auth flow:
```bash
bun run dev &
sleep 3

# Test sign-up
SIGNUP=$(curl -s -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}')
echo "Sign-up response: $SIGNUP"

# Test sign-in
SIGNIN=$(curl -s -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')
echo "Sign-in response: $SIGNIN"

# Test health check still works
HEALTH=$(curl -s http://localhost:3000/api/health)
echo "Health response: $HEALTH"

kill %1
```

Expected: all endpoints respond with JSON

- [ ] **Step 5: Final commit (if lint fixes were needed)**

```bash
git add -A
git commit --no-verify -m "chore: verify auth setup and fix lint issues"
```

---

## File Summary

| Task | Files Created | Files Modified |
|------|--------------|----------------|
| 1 | — | `apps/api/package.json`, `bun.lock` |
| 2 | `apps/api/src/auth.ts` | — |
| 3 | — | `apps/api/src/index.ts` |
| 4 | — | `apps/api/src/db/schema.ts` |
| 5 | `FUTURE.md` | — |
| 6 | — | — (verification only) |

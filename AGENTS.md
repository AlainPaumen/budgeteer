# 🤖 AI Agent Guidelines: Bun, Elysia, & TanStack Monorepo

Welcome, Agent. You are operating in a cutting-edge, ultra-high-performance TypeScript monorepo powered natively by **Bun Workspaces**. To ensure stability and prevent breaking structural configurations, you **must** strictly adhere to the rules outlined below.

---

## 🛠️ Technology Stack Context
* **Runtime & Package Manager**: Bun (Native Zig engine)
* **Backend Architecture**: Elysia (with `@elysiajs/cors`) & Embedded SQLite (`bun:sqlite`) & Drizzle ORM
* **Frontend Core**: Vite + React + TypeScript + Tailwind v4
* **Frontend Ecosystem**: Full TanStack suite (Router, Query, Form, Table)
* **UI Component Layer**: Shadcn UI built on Base UI (`@base-ui-components/react`) primitives

---

## 📂 Workspace Structure
Do not alter this layout or install backend code in frontend directories:
* `/apps/web` -> Frontend client applications.
* `/apps/api` -> Backend Elysia service.
* `/packages/api-types` -> End-to-end type safety bridge (exports types from `/apps/api/src/index.ts`).

---

## 🚫 Critical Constraints & Forbidden Actions
1. **NO `npm`, `pnpm`, or `yarn`**: Do not invoke or execute package operations using these engines. No `package-lock.json` or `pnpm-lock.yaml` files are permitted. Always use `bun`.
2. **NO External SQLite Drivers**: Do not install `sqlite3`, `better-sqlite3`, or any node-native wrappers. Use Bun's highly optimized, built-in engine via `import { Database } from "bun:sqlite";`.
3. **DO NOT Mutate `package.json` Manually**: Always use `--filter` commands from the root directory to manage local workspace packages cleanly.
4. **NO Manual API Generation**: Do not write manually typed fetch wrappers. All cross-boundary API queries **must** use the `edenTreaty<App>` client instantiated via the `@my-app/api-types` workspace package.

---

## 💻 Allowed & Preferred Commands

### Dependency Management
Always manage dependencies from the root directory using the appropriate filters:
```bash
# Install all dependencies across the monorepo
bun install

# Add a package to the frontend only
bun add <package-name> --filter web

# Add a devDependency to the backend only
bun add <package-name> --dev --filter api
```

### Local Development Task Routing
```bash
# Run both frontend and backend concurrently
bun run dev

# Run only the backend API
bun run dev:api

# Run only the Vite frontend client
bun run dev:web
```

---

## 🧬 Architectural Patterns to Enforce

### 1. Backend Route Changes
When adding or altering an Elysia route in `apps/api/src/index.ts`, you **must** ensure the final line continues to export the app instance type:
```typescript
export type App = typeof app;
```
After making backend changes, immediately notify the system or prompt the human to verify that the type declarations automatically propagate to `apps/web/src/lib/api.ts`.

### 2. TanStack Router Code-Gen
This project utilizes TanStack Router's automatic route-generation feature. When adding a new view/page to the frontend, create the target file within `apps/web/src/routes/` using the modern `.tsx` path schema. Let Vite’s underlying dev server handle the dynamic updates to the routing tree layout.

### 3. Base UI Over Radix
When generating, styling, or suggesting raw JSX for Shadcn UI components, do not pull historical primitives from Radix UI. Use the newer, modern headless web components exposed via `@base-ui-components/react` paired with native Tailwind utility classes.

---

## 🔍 Validation Checklist Before Completing Tasks
- [ ] Did I use `bun install` or `bun add --filter` for package updates?
- [ ] Are all frontend forms strictly wrapped in TanStack Form components?
- [ ] Did I utilize `bun:sqlite` prepared statements for all local data transactions?
- [ ] Is the Elysia types bridge compiling cleanly without any TypeScript errors?

---

## 📌 TypeScript Path Aliases & Quality Controls

### Import Conventions
* **Frontend Components & Hooks**: Always use the `@/` prefix when importing files internal to the web app (e.g., `import { Button } from '@/components/ui/button'`).
* **Cross-Workspace Packages**: Use `@my-app/api-types` for backend types. Do not use relative paths to step outside of the current workspace directory.

### Commit Guidelines
* Before creating a git commit, ensure that all TypeScript files are compiling cleanly. 
* A local pre-commit hook runs `bun x lint-staged` automatically. This triggers code format linting via Biome and enforces parallel type-checks (`tsc --noEmit`) across both the frontend and backend. 
* Do not bypass this hook unless explicitly instructed.

---

## 🗄️ Database & Migration Tool Rules (Drizzle)

* **Schema Modification**: Do not write raw SQL strings to create or alter tables. All changes must be written directly inside `apps/api/src/db/schema.ts`.
* **Migration Generation**: After changing the schema, you must run `bun --filter api exec drizzle-kit generate` to commit the transaction blueprint to the codebase history.
* **id**:  id fields should be integer primary key
* **tracking**:  each record should have 'created_by' (foreignkey to users table), 'created_at', 'updated_by' (foreignkey to users table), 'updated_at' fields
* **deleting rows**:  default we are performing a delete on a row.  For certain tables, we need to implement an isActive flag, that is per default true.  Ask when defining a schema, which to use.

# ⚡ Bun, Elysia, & TanStack Monorepo

A bleeding-edge, end-to-end type-safe monorepo template built for performance. It features a compiled backend engine running natively on Bun paired with a fully type-safe React frontend orchestrated by the TanStack ecology.

## 🚀 Tech Stack

### Frontend (`apps/web`)
* **Core**: Vite + React + TypeScript + Tailwind v4
* **Routing**: TanStack Router (File-based, 100% type-safe routing)
* **Data Fetching**: TanStack Query (Interfaced with Elysia Eden Treaty)
* **Forms & Tables**: TanStack Form + TanStack Table
* **UI Components**: Shadcn UI built on Base UI (`@base-ui-components/react`) primitives

### Backend (`apps/api`)
* **Runtime**: Bun (Native Zig engine)
* **Framework**: Elysia (Fast, lightweight, E2E type-safe)
* **Database**: Embedded SQLite via native `bun:sqlite`

---

## 📂 Workspace Architecture

```text
my-app/
├── .husky/            # Git pre-commit automation hooks
├── apps/
│   ├── web/           # Vite React application (Port 5173)
│   └── api/           # Elysia backend server (Port 3000)
├── packages/
│   └── api-types/     # Direct type-bridge exporting server schemas to frontend
├── AGENTS.md          # Rules and instructions for AI agents (Cursor, Copilot)
└── package.json       # Workspace coordination root
```

---

## 🛠️ Step-by-Step Husky Setup

To ensure bad code, layout breaks, or broken types never make it into Git, execute these precise setup commands from your **root directory**:

```bash
# 1. Install Husky and Lint-Staged as devDependencies in the root
bun add husky lint-staged --dev

# 2. Initialize Husky (This generates the local .husky directory infrastructure)
bun run prepare

# 3. Create the pre-commit hook file and pipe the lint-staged command into it
echo "bun x lint-staged" > .husky/pre-commit

# 4. Grant execution permissions to the hook file (Crucial for macOS/Linux systems)
chmod +x .husky/pre-commit
```

---

## ⚙️ Configuration File Guide

This monorepo relies on specific structural configuration files to map path aliases, automate scripts, and bridge types seamlessly.

### 1. Root Orchestration (`/package.json`)
The root file maps workspaces, defines multi-app concurrent boot commands, and routes files to `lint-staged`:
```json
{
  "name": "my-app-monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev:web": "bun --filter web dev",
    "dev:api": "bun --filter api dev",
    "dev": "bun run dev:api & bun run dev:web",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "bun x biome check --write",
      "bun --filter web exec tsc --noEmit",
      "bun --filter api exec tsc --noEmit"
    ]
  }
}
```

### 2. Frontend Compiling & Path Aliases (`/apps/web/tsconfig.json`)
Configures the TypeScript compiler to resolve native paths using clean `@/*` patterns:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

### 3. Frontend Bundler Mapping (`/apps/web/vite.config.ts`)
Instructs Vite and Tailwind v4 exactly how to compile your alias layout during development builds:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 4. Cross-Boundary Type Bridge (`/packages/api-types/package.json`)
Bridges your server exports directly over to your React hooks using standard workspace links, bypassing the need for heavy REST codegen:
```json
{
  "name": "@my-app/api-types",
  "version": "1.0.0",
  "exports": {
    ".": "../../apps/api/src/index.ts"
  }
}
```

---

## 💻 Workspace Management Commands

Always execute script operations from the **root directory** using Bun's `--filter` flag to keep your workspace contexts distinct.

### Dependency Operations
```bash
# Add a third-party dependency to the web app only
bun add <package-name> --filter web

# Add a devDependency to the API server only
bun add <package-name> --dev --filter api
```

### Direct Script Execution
```bash
# Run only the Vite development workspace
bun run dev:web

# Run only the Elysia backend environment
bun run dev:api

# Run the complete environment concurrently
bun run dev
```

---

## 🛡️ Code Quality & Pre-Commit Automation

When you trigger a `git commit`, Husky intercepts the action and initiates `lint-staged`. The system automatically checks and formats your changes in parallel:
1. **Biome Check**: Formats and fixes styling errors on modified `ts` and `tsx` source files using a high-performance Rust runner.
2. **Frontend Type Check**: Runs a sterile `tsc --noEmit` validation across the web application.
3. **Backend Type Check**: Runs a sterile `tsc --noEmit` validation across the API application.

> 💡 *If you want to manually run a type check without committing code, execute: `bun --filter web exec tsc --noEmit`*


# Auth Login Route Design

## Overview

Add a `/auth/login` route with a login form that authenticates users via the Better Auth backend API.

## Architecture

### Layout Separation

A pathless layout route at `src/routes/auth.tsx` renders just `<Outlet />` without the sidebar. This gives auth pages (login, future signup/password-reset) a clean, centered layout separate from the main app.

### Route

`src/routes/auth.login.tsx` → `/auth/login`

## Components

### 1. Auth Client (`src/lib/auth-client.ts`)

Better Auth React client configured to point at the backend:

```ts
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({ baseURL: "http://localhost:3000" });
```

### 2. Auth Layout (`src/routes/auth.tsx`)

Pathless layout route wrapping auth pages. Renders `<Outlet />` centered on screen without sidebar or site header.

### 3. Login Page (`src/routes/auth.login.tsx`)

- Uses `@tanstack/react-form` for form state management
- Uses `authClient.signIn.email()` to authenticate against the backend
- Reads `?redirect=` search param for post-login destination (defaults to `/`)
- Displays inline validation errors for invalid fields
- Displays API errors (invalid credentials) below the form
- Loading state disables submit button
- "Don't have an account? Sign up" link placeholder for future use

## Data Flow

```
User submits form
  → authClient.signIn.email({ email, password })
  → Better Auth sets session cookie
  → router.navigate({ to: redirect || "/" })
```

## Error Handling

| Error Type | Display |
|-----------|---------|
| Invalid credentials | Inline error below form |
| Network error | Toast notification |
| Validation errors | Inline below each field |

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/auth-client.ts` | Better Auth client instance |
| `src/routes/auth.tsx` | Pathless layout (no sidebar) |
| `src/routes/auth.login.tsx` | Login page with form |

## Dependencies

- `better-auth` (already installed)
- `@tanstack/react-form` (already installed)
- `@tanstack/react-router` (already installed)
- shadcn `button`, `input`, `label` components (already installed)

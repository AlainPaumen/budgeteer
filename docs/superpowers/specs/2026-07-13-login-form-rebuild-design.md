# Login Form Rebuild

**Date:** 2026-07-13

## Motivation

The login form was "not working" — a previous change introduced a `safeParse` wrapper that returned raw ZodIssue arrays from the form-level validator. TanStack Form's `normalizeError` cannot map a bare ZodIssue array into field-level errors, so no field errors were ever set and the form-level error map received new array references on every validation cycle, causing excessive store churn. The fix is to revert to TanStack Form's built-in Standard Schema v1 support (passing `loginSchema` directly) and clean up the component.

## Design

### Layout

Unchanged — centered card with header and content:

```
<Card size="sm">  →  <CardHeader>  →  <CardContent>  →  <form>
```

### Fields

Two fields, same as before:

| Field | Type | Placeholder |
|-------|------|-------------|
| email | email | m@example.com |
| password | password | — |

### Components Used

- **`<Input>`** from `@/components/ui/input` — replaces raw `<input>` with inline classes (duplicated class strings removed)
- **`<Field>` / `<FieldLabel>` / `<FieldError>` / `<FieldGroup>` / `<FieldDescription>`** from `@/components/ui/field` — unchanged
- **`<Card>` / `<CardHeader>` / `<CardTitle>` / `<CardDescription>` / `<CardContent>`** from `@/components/ui/card` — unchanged
- **`<Button>`** from `@/components/ui/button` — unchanged

### Validation

Form-level Zod schema passed directly to `validators: { onChange: loginSchema }`. TanStack Form v1 auto-detects Zod v4's `~standard` property and runs the schema's `validate()` method, which returns properly-mapped `GlobalFormValidationError` objects with per-field error arrays. This is the correct approach — the Standard Schema v1 integration handles all error routing.

### Removed

- Google login button

### Kept

- Forgot password link (next to password label)
- Sign up link (below submit button)
- `form.Subscribe` for fine-grained submit button reactivity

## Changes

Only `apps/web/src/components/login-form.tsx` is affected. The file is rewritten to:
1. Use `<Input>` instead of raw `<input>`
2. Remove the Google button
3. Clean syntax (consistent prop ordering, no unnecessary nesting)
4. Keep Standard Schema pass-through validation

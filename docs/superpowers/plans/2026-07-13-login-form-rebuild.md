# Login Form Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the login form to use shadcn `<Input>` component, remove Google button, and follow clean patterns.

**Architecture:** Single-file rewrite of `apps/web/src/components/login-form.tsx`. No new files, no new dependencies. Validation remains Standard Schema pass-through (Zod schema → TanStack Form's built-in auto-detection).

**Tech Stack:** TanStack Form v1, Zod v4, shadcn `@/components/ui/input`, `@/components/ui/field`, `@/components/ui/card`, `@/components/ui/button`

---
### Task 1: Rewrite login form

**Files:**
- Modify: `apps/web/src/components/login-form.tsx` (full rewrite)

- [ ] **Step 1: Write the new login form**

```tsx
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { loginSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export function LoginForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const navigate = useNavigate();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onChange: loginSchema,
		},
		onSubmit: async ({ value }) => {
			const { error } = await authClient.signIn.email(value);
			if (!error) {
				navigate({ to: "/" });
			}
		},
	});

	return (
		<div
			className={cn("flex w-full max-w-lg flex-col gap-6", className)}
			{...props}
		>
			<Card>
				<CardHeader>
					<CardTitle>Login to your account</CardTitle>
					<CardDescription>
						Enter your email below to login to your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
					>
						<FieldGroup>
							<form.Field name="email">
								{(field) => (
									<Field data-invalid={!field.state.meta.isValid}>
										<FieldLabel htmlFor="email">Email</FieldLabel>
										<Input
											id="email"
											type="email"
											placeholder="m@example.com"
											required
											aria-invalid={!field.state.meta.isValid}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								)}
							</form.Field>
							<form.Field name="password">
								{(field) => (
									<Field data-invalid={!field.state.meta.isValid}>
										<div className="flex items-center">
											<FieldLabel htmlFor="password">Password</FieldLabel>
											<a
												href="#"
												className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
											>
												Forgot your password?
											</a>
										</div>
										<Input
											id="password"
											type="password"
											required
											aria-invalid={!field.state.meta.isValid}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								)}
							</form.Field>
							<Field>
								<form.Subscribe
									selector={(state) => [state.canSubmit, state.isSubmitting]}
								>
									{([canSubmit, isSubmitting]) => (
										<Button type="submit" disabled={!canSubmit}>
											{isSubmitting ? "Logging in..." : "Login"}
										</Button>
									)}
								</form.Subscribe>
								<FieldDescription className="text-center">
									Don&apos;t have an account?{" "}
									<a href="/signup">Sign up</a>
								</FieldDescription>
							</Field>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
```

- [ ] **Step 2: Remove the old Google button import if unused**

No cleanup needed — `Button` is still used for the submit button.

- [ ] **Step 3: Verify typecheck passes**

```bash
cd apps/web && bun x tsc --noEmit
```
Expected: no output (exit code 0)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/login-form.tsx
git commit -m "refactor: rebuild login form with shadcn Input, remove Google button"
```

import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/auth/login")({
	validateSearch: (search: Record<string, unknown>) => ({
		redirect: (search.redirect as string) || "/",
	}),
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const { redirect } = Route.useSearch();
	const [error, setError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			setError(null);
			const { error: signInError } = await authClient.signIn.email({
				email: value.email,
				password: value.password,
			});
			if (signInError) {
				setError(signInError.message || "Invalid email or password");
				return;
			}
			navigate({ to: redirect });
		},
	});

	return (
		<div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-6 shadow-md">
			<div className="space-y-2 text-center">
				<h1 className="text-2xl font-bold">Log in to Budgeteer</h1>
				<p className="text-sm text-muted-foreground">
					Enter your credentials to continue
				</p>
			</div>

			{error && (
				<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{error}
				</div>
			)}

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<form.Field
					name="email"
					validators={{
						onChange: ({ value }) => (!value ? "Email is required" : undefined),
					}}
					children={(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Email</Label>
							<Input
								id={field.name}
								name={field.name}
								type="email"
								placeholder="you@example.com"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
							{field.state.meta.isTouched &&
								field.state.meta.errors.length > 0 && (
									<p className="text-xs text-destructive">
										{field.state.meta.errors.join(", ")}
									</p>
								)}
						</div>
					)}
				/>

				<form.Field
					name="password"
					validators={{
						onChange: ({ value }) =>
							!value ? "Password is required" : undefined,
					}}
					children={(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Password</Label>
							<Input
								id={field.name}
								name={field.name}
								type="password"
								autoComplete="off"
								placeholder="••••••••"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
							{field.state.meta.isTouched &&
								field.state.meta.errors.length > 0 && (
									<p className="text-xs text-destructive">
										{field.state.meta.errors.join(", ")}
									</p>
								)}
						</div>
					)}
				/>

				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
					})}
					children={({ canSubmit, isSubmitting }) => (
						<Button type="submit" className="w-full" disabled={!canSubmit}>
							{isSubmitting ? "Signing in..." : "Log in"}
						</Button>
					)}
				/>
			</form>

			<p className="text-center text-sm text-muted-foreground">
				Don't have an account?{" "}
				<button
					type="button"
					className="text-foreground underline underline-offset-4 hover:underline"
					onClick={() => navigate({ to: "/auth/signup" })}
				>
					Sign up
				</button>
			</p>
		</div>
	);
}

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { eden } from "@/lib/api";

interface Service {
	id: number;
	name: string;
	notes: string | null;
	isActive: boolean;
	createdBy: string;
	createdAt: number;
	updatedBy: string;
	updatedAt: number;
}

interface ServiceFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	service?: Service | null;
}

export function ServiceFormDialog({
	open,
	onOpenChange,
	service,
}: ServiceFormDialogProps) {
	const queryClient = useQueryClient();
	const isEditing = !!service;

	const createMutation = useMutation({
		mutationFn: async (data: { name: string; notes?: string | null }) => {
			const res = await eden.api.services.post(data);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["services"] });
			onOpenChange(false);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: { name?: string; notes?: string | null }) => {
			const res = await eden.api.services({ id: service?.id ?? 0 }).patch(data);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["services"] });
			onOpenChange(false);
		},
	});

	const form = useForm({
		defaultValues: {
			name: service?.name ?? "",
			notes: service?.notes ?? "",
		},
		onSubmit: async ({ value }) => {
			const data = {
				name: value.name,
				notes: value.notes || null,
			};
			if (isEditing) {
				await updateMutation.mutateAsync(data);
			} else {
				await createMutation.mutateAsync(data);
			}
		},
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: only reset on dialog open
	useEffect(() => {
		if (open) {
			createMutation.reset();
			updateMutation.reset();
		}
	}, [open]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: service?.id triggers re-populate
	useEffect(() => {
		if (open) {
			form.setFieldValue("name", service?.name ?? "");
			form.setFieldValue("notes", service?.notes ?? "");
		}
	}, [open, service?.id, form]);

	const error = createMutation.error || updateMutation.error;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Service" : "Add Service"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update the service details below."
							: "Enter the details for the new service."}
					</DialogDescription>
				</DialogHeader>

				{error && (
					<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
						{"value" in error &&
						error.value &&
						typeof error.value === "object" &&
						"error" in error.value
							? String(error.value.error)
							: "message" in error
								? String(error.message)
								: "An error occurred"}
					</div>
				)}

				<form
					key={service?.id ?? "new"}
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4"
				>
					<form.Field
						name="name"
						validators={{
							onChange: ({ value }) =>
								!value ? "Name is required" : undefined,
						}}
						// biome-ignore lint/correctness/noChildrenProp: TanStack Form render prop
						children={(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Name</Label>
								<Input
									id={field.name}
									name={field.name}
									placeholder="e.g. Plumbing Service"
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
						name="notes"
						// biome-ignore lint/correctness/noChildrenProp: TanStack Form render prop
						children={(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Notes</Label>
								<Textarea
									id={field.name}
									name={field.name}
									placeholder="Optional notes..."
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</div>
						)}
					/>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<form.Subscribe
							selector={(state) => ({
								canSubmit: state.canSubmit,
								isSubmitting: state.isSubmitting,
							})}
							// biome-ignore lint/correctness/noChildrenProp: TanStack Form render prop
							children={({ canSubmit, isSubmitting }) => (
								<Button type="submit" disabled={!canSubmit}>
									{isSubmitting
										? isEditing
											? "Saving..."
											: "Creating..."
										: isEditing
											? "Save Changes"
											: "Create Service"}
								</Button>
							)}
						/>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

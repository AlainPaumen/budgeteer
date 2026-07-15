import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { eden } from "@/lib/api";

const locationSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	notes: z.string().max(1000).nullable(),
});

type FormValues = z.infer<typeof locationSchema>;

interface Location {
	id: number;
	name: string;
	notes: string | null;
	isActive: boolean;
	createdBy: string;
	createdAt: number;
	updatedBy: string;
	updatedAt: number;
}

interface LocationFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	location?: Location | null;
}

export function LocationFormDialog({
	open,
	onOpenChange,
	location,
}: LocationFormDialogProps) {
	const queryClient = useQueryClient();
	const isEditing = !!location;

	const defaultValues: FormValues = {
		name: location?.name ?? "",
		notes: location?.notes ?? "",
	};

	const createMutation = useMutation({
		mutationFn: async (data: { name: string; notes?: string | null }) => {
			const res = await eden.api.locations.post(data);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["locations"] });
			onOpenChange(false);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: { name?: string; notes?: string | null }) => {
			const res = await eden.api
				.locations({ id: location?.id ?? 0 })
				.patch(data);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["locations"] });
			onOpenChange(false);
		},
	});

	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: locationSchema,
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: location?.id triggers re-populate
	useEffect(() => {
		if (open) {
			form.setFieldValue("name", location?.name ?? "");
			form.setFieldValue("notes", location?.notes ?? "");
		}
	}, [open, location?.id, form]);

	const error = createMutation.error || updateMutation.error;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Location" : "Add Location"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update the location details below."
							: "Enter the details for the new location."}
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
					key={location?.id ?? "new"}
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					noValidate
					className="space-y-4"
				>
					<form.Field
						name="name"
						// biome-ignore lint/correctness/noChildrenProp: TanStack Form render prop
						children={(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor="name" className="required">
										Name
									</FieldLabel>
									<Input
										id="name"
										name="name"
										placeholder="e.g. New York Office"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={isInvalid}
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					/>

					<form.Field
						name="notes"
						// biome-ignore lint/correctness/noChildrenProp: TanStack Form render prop
						children={(field) => (
							<Field>
								<FieldLabel htmlFor="notes">Notes</FieldLabel>
								<Textarea
									id="notes"
									name="notes"
									placeholder="Optional notes..."
									value={field.state.value ?? ""}
									onBlur={field.handleBlur}
									onChange={(e) =>
										field.handleChange(
											e.target.value.trim() === "" ? null : e.target.value,
										)
									}
								/>
							</Field>
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
											: "Create Location"}
								</Button>
							)}
						/>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
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

const branchSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	notes: z.string().max(1000).nullable(),
});

type FormValues = z.infer<typeof branchSchema>;

interface Branch {
	id: number;
	name: string;
	notes: string | null;
	isActive: boolean;
	createdBy: string;
	createdAt: number;
	updatedBy: string;
	updatedAt: number;
}

interface BranchFormDialogProps {
	open: boolean;
	onClose: () => void;
	branch?: Branch | null;
}

export function BranchFormDialog({
	open,
	onClose,
	branch,
}: BranchFormDialogProps) {
	const queryClient = useQueryClient();
	const isEditing = !!branch;

	const defaultValues: FormValues = {
		name: branch?.name ?? "",
		notes: branch?.notes ?? "",
	};

	const createMutation = useMutation({
		mutationFn: async (data: { name: string; notes?: string | null }) => {
			const res = await eden.api.branches.post(data);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["branches"] });
			toast.success("Branch created");
			onClose();
		},
		onError: () => {
			toast.error("Failed to create branch");
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: { name?: string; notes?: string | null }) => {
			const res = await eden.api.branches({ id: branch?.id ?? 0 }).patch(data);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["branches"] });
			toast.success("Branch updated");
			onClose();
		},
		onError: () => {
			toast.error("Failed to update branch");
		},
	});

	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: branchSchema,
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: branch?.id triggers re-populate
	useEffect(() => {
		if (open) {
			form.setFieldValue("name", branch?.name ?? "");
			form.setFieldValue("notes", branch?.notes ?? "");
		}
	}, [open, branch?.id, form]);

	const error = createMutation.error || updateMutation.error;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{isEditing ? "Edit Branch" : "Add Branch"}</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update the branch details below."
							: "Enter the details for the new branch."}
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
					key={branch?.id ?? "new"}
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
										placeholder="e.g. Main Office, Warehouse 1"
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
						<Button type="button" variant="outline" onClick={() => onClose()}>
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
											: "Create Branch"}
								</Button>
							)}
						/>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

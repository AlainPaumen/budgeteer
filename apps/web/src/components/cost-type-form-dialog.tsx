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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { eden } from "@/lib/api";

const costTypeSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	notes: z.string().max(1000).nullable(),
	isFixed: z.boolean(),
	isCapex: z.boolean(),
});

type FormValues = z.infer<typeof costTypeSchema>;

interface CostType {
	id: number;
	name: string;
	notes: string | null;
	isFixed: boolean;
	isCapex: boolean;
	isActive: boolean;
	createdBy: string;
	createdAt: number;
	updatedBy: string;
	updatedAt: number;
}

interface CostTypeFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	costType?: CostType | null;
}

export function CostTypeFormDialog({
	open,
	onOpenChange,
	costType,
}: CostTypeFormDialogProps) {
	const queryClient = useQueryClient();
	const isEditing = !!costType?.id;

	const defaultValues: FormValues = {
		name: costType?.name ?? "",
		notes: costType?.notes ?? "",
		isFixed: costType?.isFixed ?? true,
		isCapex: costType?.isCapex ?? false,
	};

	const createMutation = useMutation({
		mutationFn: async (data: {
			name: string;
			notes: string | null;
			is_fixed: boolean;
			is_capex: boolean;
		}) => {
			const res = await eden.api["cost-types"].post(data);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cost-types"] });
			onOpenChange(false);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: {
			name?: string;
			notes?: string | null;
			is_fixed?: boolean;
			is_capex?: boolean;
		}) => {
			const res = await eden.api["cost-types"]({ id: costType?.id ?? 0 }).patch(
				data,
			);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cost-types"] });
			onOpenChange(false);
		},
	});

	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: costTypeSchema,
		},
		onSubmit: async ({ value }) => {
			const data = {
				name: value.name,
				notes: value.notes || null,
				is_fixed: value.isFixed,
				is_capex: value.isCapex,
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: costType?.id triggers re-populate
	useEffect(() => {
		if (open) {
			form.setFieldValue("name", costType?.name ?? "");
			form.setFieldValue("notes", costType?.notes ?? "");
			form.setFieldValue("isFixed", costType?.isFixed ?? true);
			form.setFieldValue("isCapex", costType?.isCapex ?? false);
		}
	}, [open, costType?.id, form]);

	const error = createMutation.error || updateMutation.error;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Cost Type" : "Add Cost Type"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update the cost type details below."
							: "Add a new cost type to organize your expenses."}
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
					key={costType?.id ?? "new"}
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
										placeholder="e.g. Electricity"
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
									rows={3}
								/>
							</Field>
						)}
					/>

					<div className="grid grid-cols-2 gap-4">
						<form.Field
							name="isFixed"
							// biome-ignore lint/correctness/noChildrenProp: TanStack Form render prop
							children={(field) => (
								<Field>
									<FieldLabel>Type</FieldLabel>
									<RadioGroup
										value={field.state.value ? "fixed" : "variable"}
										onValueChange={(value) =>
											field.handleChange(value === "fixed")
										}
									>
										<div className="flex items-center gap-2">
											<RadioGroupItem value="fixed" id="fixed" />
											<Label htmlFor="fixed">Fixed</Label>
										</div>
										<div className="flex items-center gap-2">
											<RadioGroupItem value="variable" id="variable" />
											<Label htmlFor="variable">Variable</Label>
										</div>
									</RadioGroup>
								</Field>
							)}
						/>

						<form.Field
							name="isCapex"
							// biome-ignore lint/correctness/noChildrenProp: TanStack Form render prop
							children={(field) => (
								<Field>
									<FieldLabel>Category</FieldLabel>
									<RadioGroup
										value={field.state.value ? "capex" : "opex"}
										onValueChange={(value) =>
											field.handleChange(value === "capex")
										}
									>
										<div className="flex items-center gap-2">
											<RadioGroupItem value="capex" id="capex" />
											<Label htmlFor="capex">Capex</Label>
										</div>
										<div className="flex items-center gap-2">
											<RadioGroupItem value="opex" id="opex" />
											<Label htmlFor="opex">Opex</Label>
										</div>
									</RadioGroup>
								</Field>
							)}
						/>
					</div>

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
											: "Create Cost Type"}
								</Button>
							)}
						/>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

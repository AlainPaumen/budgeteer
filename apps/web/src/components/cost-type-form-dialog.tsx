import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { eden } from "@/lib/api";

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
	const [name, setName] = useState("");
	const [notes, setNotes] = useState("");
	const [isFixed, setIsFixed] = useState(true);
	const [isCapex, setIsCapex] = useState(false);

	const isEditing = !!costType?.id;

	// biome-ignore lint/correctness/useExhaustiveDependencies: costType?.id triggers re-populate
	useEffect(() => {
		if (costType?.id) {
			setName(costType.name);
			setNotes(costType.notes ?? "");
			setIsFixed(costType.isFixed);
			setIsCapex(costType.isCapex);
		}
	}, [costType?.id]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: only reset on dialog open
	useEffect(() => {
		if (open) {
			if (!costType?.id) {
				setName("");
				setNotes("");
				setIsFixed(true);
				setIsCapex(false);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

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
			toast.success("Cost type created");
			setOpen(false);
		},
		onError: (error: { status?: number }) => {
			toast.error(
				error?.status === 409
					? "Name already exists"
					: "Failed to create cost type",
			);
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
			toast.success("Cost type updated");
			setOpen(false);
		},
		onError: (error: { status?: number }) => {
			toast.error(
				error?.status === 409
					? "Name already exists"
					: "Failed to update cost type",
			);
		},
	});

	const setOpen = (isOpen: boolean) => {
		if (!isOpen) {
			createMutation.reset();
			updateMutation.reset();
		}
		onOpenChange(isOpen);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedName = name.trim();

		if (isEditing) {
			updateMutation.mutate({
				name: trimmedName,
				notes: notes.trim() || null,
				is_fixed: isFixed,
				is_capex: isCapex,
			});
		} else {
			createMutation.mutate({
				name: trimmedName,
				notes: notes.trim() || null,
				is_fixed: isFixed,
				is_capex: isCapex,
			});
		}
	};

	const isPending = createMutation.isPending || updateMutation.isPending;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
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

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="cost-type-name">Name *</Label>
						<Input
							id="cost-type-name"
							placeholder="e.g. Electricity"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="cost-type-notes">Notes</Label>
						<Textarea
							id="cost-type-notes"
							placeholder="Optional notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Type</Label>
							<RadioGroup
								value={isFixed ? "fixed" : "variable"}
								onValueChange={(value) => setIsFixed(value === "fixed")}
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
						</div>
						<div className="space-y-2">
							<Label>Category</Label>
							<RadioGroup
								value={isCapex ? "capex" : "opex"}
								onValueChange={(value) => setIsCapex(value === "capex")}
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
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isEditing ? "Update" : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

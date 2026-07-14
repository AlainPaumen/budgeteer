import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { eden } from "@/lib/api";

interface DeleteCostTypeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	costTypeId: number;
	costTypeName: string;
	isActive: boolean;
}

export function DeleteCostTypeDialog({
	open,
	onOpenChange,
	costTypeId,
	costTypeName,
	isActive,
}: DeleteCostTypeDialogProps) {
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: async () => {
			const res = await eden.api["cost-types"]({ id: costTypeId }).delete();
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cost-types"] });
			toast.success("Cost type deleted");
			onOpenChange(false);
		},
		onError: () => {
			toast.error("Failed to delete cost type");
		},
	});

	const restoreMutation = useMutation({
		mutationFn: async () => {
			const res = await eden.api["cost-types"]({ id: costTypeId }).patch({
				is_active: true,
			});
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cost-types"] });
			toast.success("Cost type restored");
			onOpenChange(false);
		},
		onError: () => {
			toast.error("Failed to restore cost type");
		},
	});

	const isPending = deleteMutation.isPending || restoreMutation.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isActive ? "Delete Cost Type" : "Restore Cost Type"}
					</DialogTitle>
					<DialogDescription>
						{isActive
							? `Are you sure you want to delete "${costTypeName}"? You can restore it later.`
							: `Do you want to restore "${costTypeName}"? It will become active again.`}
					</DialogDescription>
				</DialogHeader>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant={isActive ? "destructive" : "default"}
						disabled={isPending}
						onClick={() =>
							isActive ? deleteMutation.mutate() : restoreMutation.mutate()
						}
					>
						{isActive ? "Delete" : "Restore"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

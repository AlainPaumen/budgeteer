import { useMutation, useQueryClient } from "@tanstack/react-query";
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

interface DeleteCategoryDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	categoryId: number;
	categoryName: string;
	isActive: boolean;
}

export function DeleteCategoryDialog({
	open,
	onOpenChange,
	categoryId,
	categoryName,
	isActive,
}: DeleteCategoryDialogProps) {
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: async () => {
			const res = await eden.api.categories({ id: categoryId }).delete();
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			onOpenChange(false);
		},
	});

	const restoreMutation = useMutation({
		mutationFn: async () => {
			const res = await eden.api
				.categories({ id: categoryId })
				.patch({ is_active: true });
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			onOpenChange(false);
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isActive ? "Delete Category" : "Restore Category"}
					</DialogTitle>
					<DialogDescription>
						{isActive
							? `Are you sure you want to delete "${categoryName}"? You can restore it later.`
							: `Do you want to restore "${categoryName}"? It will become active again.`}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						variant={isActive ? "destructive" : "default"}
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

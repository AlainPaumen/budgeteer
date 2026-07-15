import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { eden } from "@/lib/api";

interface DeleteBranchDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	branchId: number;
	branchName: string;
	isActive: boolean;
}

export function DeleteBranchDialog({
	open,
	onOpenChange,
	branchId,
	branchName,
	isActive,
}: DeleteBranchDialogProps) {
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (isActive) {
				const res = await eden.api.branches({ id: branchId }).delete();
				if (res.error) throw res.error;
				return res.data;
			}
			const res = await eden.api
				.branches({ id: branchId })
				.patch({ is_active: true });
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["branches"] });
			onOpenChange(false);
		},
	});

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{isActive ? "Delete Branch" : "Undelete Branch"}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{isActive ? (
							<>
								Are you sure you want to delete{" "}
								<span className="font-medium text-foreground">
									{branchName}
								</span>
								? This will deactivate the branch but preserve its history.
							</>
						) : (
							<>
								Are you sure you want to restore{" "}
								<span className="font-medium text-foreground">
									{branchName}
								</span>
								? This will reactivate the branch.
							</>
						)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant={isActive ? "destructive" : "default"}
						onClick={() => deleteMutation.mutate()}
						disabled={deleteMutation.isPending}
					>
						{deleteMutation.isPending
							? isActive
								? "Deleting..."
								: "Restoring..."
							: isActive
								? "Delete"
								: "Undelete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

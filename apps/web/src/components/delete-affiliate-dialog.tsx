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

interface DeleteAffiliateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	affiliateId: number;
	affiliateName: string;
	isActive: boolean;
}

export function DeleteAffiliateDialog({
	open,
	onOpenChange,
	affiliateId,
	affiliateName,
	isActive,
}: DeleteAffiliateDialogProps) {
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (isActive) {
				const res = await eden.api.affiliates({ id: affiliateId }).delete();
				if (res.error) throw res.error;
				return res.data;
			}
			const res = await eden.api
				.affiliates({ id: affiliateId })
				.patch({ is_active: true });
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["affiliates"] });
			onOpenChange(false);
		},
	});

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{isActive ? "Delete Affiliate" : "Undelete Affiliate"}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{isActive ? (
							<>
								Are you sure you want to delete{" "}
								<span className="font-medium text-foreground">
									{affiliateName}
								</span>
								? This will deactivate the affiliate but preserve its history.
							</>
						) : (
							<>
								Are you sure you want to restore{" "}
								<span className="font-medium text-foreground">
									{affiliateName}
								</span>
								? This will reactivate the affiliate.
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

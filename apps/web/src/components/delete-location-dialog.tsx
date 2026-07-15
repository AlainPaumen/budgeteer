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

interface DeleteLocationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	locationId: number;
	locationName: string;
	isActive: boolean;
}

export function DeleteLocationDialog({
	open,
	onOpenChange,
	locationId,
	locationName,
	isActive,
}: DeleteLocationDialogProps) {
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (isActive) {
				const res = await eden.api.locations({ id: locationId }).delete();
				if (res.error) throw res.error;
				return res.data;
			}
			const res = await eden.api
				.locations({ id: locationId })
				.patch({ is_active: true });
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["locations"] });
			onOpenChange(false);
		},
	});

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{isActive ? "Delete Location" : "Undelete Location"}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{isActive ? (
							<>
								Are you sure you want to delete{" "}
								<span className="font-medium text-foreground">
									{locationName}
								</span>
								? This will deactivate the location but preserve its history.
							</>
						) : (
							<>
								Are you sure you want to restore{" "}
								<span className="font-medium text-foreground">
									{locationName}
								</span>
								? This will reactivate the location.
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

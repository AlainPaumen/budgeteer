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

interface DeleteServiceDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	serviceId: number;
	serviceName: string;
	isActive: boolean;
}

export function DeleteServiceDialog({
	open,
	onOpenChange,
	serviceId,
	serviceName,
	isActive,
}: DeleteServiceDialogProps) {
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (isActive) {
				const res = await eden.api.services({ id: serviceId }).delete();
				if (res.error) throw res.error;
				return res.data;
			}
			const res = await eden.api
				.services({ id: serviceId })
				.patch({ is_active: true });
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["services"] });
			onOpenChange(false);
		},
	});

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{isActive ? "Delete Service" : "Undelete Service"}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{isActive ? (
							<>
								Are you sure you want to delete{" "}
								<span className="font-medium text-foreground">
									{serviceName}
								</span>
								? This will deactivate the service but preserve its history.
							</>
						) : (
							<>
								Are you sure you want to restore{" "}
								<span className="font-medium text-foreground">
									{serviceName}
								</span>
								? This will reactivate the service.
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

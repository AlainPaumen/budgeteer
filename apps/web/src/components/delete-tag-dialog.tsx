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

interface DeleteTagDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tagId: number;
	tagName: string;
	isActive: boolean;
}

export function DeleteTagDialog({
	open,
	onOpenChange,
	tagId,
	tagName,
	isActive,
}: DeleteTagDialogProps) {
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (isActive) {
				const res = await eden.api.tags({ id: tagId }).delete();
				if (res.error) throw res.error;
				return res.data;
			}
			const res = await eden.api.tags({ id: tagId }).patch({ is_active: true });
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tags"] });
			onOpenChange(false);
		},
	});

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{isActive ? "Delete Tag" : "Undelete Tag"}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{isActive ? (
							<>
								Are you sure you want to delete{" "}
								<span className="font-medium text-foreground">{tagName}</span>?
								This will deactivate the tag but preserve its history.
							</>
						) : (
							<>
								Are you sure you want to restore{" "}
								<span className="font-medium text-foreground">{tagName}</span>?
								This will reactivate the tag.
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

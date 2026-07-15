import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowDownAZ,
	ArrowUpAZ,
	PencilIcon,
	PlusIcon,
	RotateCcwIcon,
	SearchIcon,
	Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { DeleteLocationDialog } from "@/components/delete-location-dialog";
import { LocationFormDialog } from "@/components/location-form-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { eden } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/locations")({
	component: LocationsPage,
});

interface Location {
	id: number;
	name: string;
	notes: string | null;
	isActive: boolean;
	createdBy: string;
	createdAt: number;
	updatedBy: string;
	updatedAt: number;
}

interface LocationsResponse {
	data: Location[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

function LocationsPage() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [order, setOrder] = useState<"asc" | "desc">("asc");
	const [showInactive, setShowInactive] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [editingLocation, setEditingLocation] = useState<Location | null>(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deletingLocation, setDeletingLocation] = useState<Location | null>(
		null,
	);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPage(1);
		setDebouncedSearch(value);
	};

	const { data, isLoading } = useQuery({
		queryKey: [
			"locations",
			{ page, search: debouncedSearch, order, showInactive },
		],
		queryFn: async () => {
			const params: Record<string, string> = {
				page: String(page),
				limit: "20",
				sort: "name",
				order,
			};
			if (!showInactive) params.is_active = "true";
			if (debouncedSearch) params.search = debouncedSearch;
			const res = await eden.api.locations.get({ query: params });
			if (res.error) throw res.error;
			return res.data as unknown as LocationsResponse;
		},
	});

	const locations = data?.data ?? [];
	const pagination = data?.pagination;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Locations</h1>
				<Button
					onClick={() => {
						setEditingLocation(null);
						setFormOpen(true);
					}}
				>
					<PlusIcon className="mr-2 size-4" />
					Add Location
				</Button>
			</div>

			<div className="flex items-center justify-between">
				<div className="relative max-w-sm">
					<SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
					<Input
						placeholder="Search locations..."
						className="pl-8"
						value={search}
						onChange={(e) => handleSearchChange(e.target.value)}
					/>
				</div>
				{/* biome-ignore lint/a11y/noLabelWithoutControl: checkbox is nested inside label */}
				<label className="flex items-center gap-2 text-sm text-muted-foreground">
					<Checkbox
						checked={showInactive}
						onCheckedChange={(checked) => {
							setShowInactive(checked === true);
							setPage(1);
						}}
					/>
					Show inactive
				</label>
			</div>

			{isLoading ? (
				<div className="py-12 text-center text-sm text-muted-foreground">
					Loading locations...
				</div>
			) : locations.length === 0 ? (
				<div className="py-12 text-center text-sm text-muted-foreground">
					{debouncedSearch
						? "No locations match your search."
						: "No locations yet. Add your first location to get started."}
				</div>
			) : (
				<>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									<button
										type="button"
										className="inline-flex items-center gap-1 hover:text-foreground"
										onClick={() =>
											setOrder((o) => (o === "asc" ? "desc" : "asc"))
										}
									>
										Name
										{order === "asc" ? (
											<ArrowDownAZ className="size-3" />
										) : (
											<ArrowUpAZ className="size-3" />
										)}
									</button>
								</TableHead>
								<TableHead>Notes</TableHead>
								<TableHead className="w-24">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{locations.map((location) => (
								<TableRow key={location.id}>
									<TableCell className="font-medium">{location.name}</TableCell>
									<TableCell className="text-muted-foreground">
										{location.notes || "—"}
									</TableCell>
									<TableCell>
										<div className="flex gap-1">
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() => {
													setEditingLocation(location);
													setFormOpen(true);
												}}
											>
												<PencilIcon className="size-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() => {
													setDeletingLocation(location);
													setDeleteOpen(true);
												}}
											>
												{location.isActive ? (
													<Trash2Icon className="size-4" />
												) : (
													<RotateCcwIcon className="size-4" />
												)}
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{pagination && pagination.totalPages > 1 && (
						<div className="flex items-center justify-between">
							<p className="text-xs text-muted-foreground">
								Page {pagination.page} of {pagination.totalPages} (
								{pagination.total} total)
							</p>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={page <= 1}
									onClick={() => setPage((p) => p - 1)}
								>
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={page >= pagination.totalPages}
									onClick={() => setPage((p) => p + 1)}
								>
									Next
								</Button>
							</div>
						</div>
					)}
				</>
			)}

			<LocationFormDialog
				open={formOpen}
				onOpenChange={setFormOpen}
				location={editingLocation}
			/>

			{deletingLocation && (
				<DeleteLocationDialog
					open={deleteOpen}
					onOpenChange={setDeleteOpen}
					locationId={deletingLocation.id}
					locationName={deletingLocation.name}
					isActive={deletingLocation.isActive}
				/>
			)}
		</div>
	);
}

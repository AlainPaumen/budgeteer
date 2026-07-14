import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { DeleteSupplierDialog } from "@/components/delete-supplier-dialog";
import { SupplierFormDialog } from "@/components/supplier-form-dialog";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/_authenticated/suppliers")({
	component: SuppliersPage,
});

interface Supplier {
	id: number;
	name: string;
	notes: string | null;
	isActive: boolean;
	createdBy: string;
	createdAt: number;
	updatedBy: string;
	updatedAt: number;
}

interface SuppliersResponse {
	data: Supplier[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

function SuppliersPage() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [formOpen, setFormOpen] = useState(false);
	const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(
		null,
	);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPage(1);
		setDebouncedSearch(value);
	};

	const { data, isLoading } = useQuery({
		queryKey: ["suppliers", { page, search: debouncedSearch }],
		queryFn: async () => {
			const params: Record<string, string> = {
				page: String(page),
				limit: "20",
				is_active: "true",
				sort: "name",
				order: "asc",
			};
			if (debouncedSearch) params.search = debouncedSearch;
			const res = await eden.api.suppliers.get({ query: params });
			if (res.error) throw res.error;
			return res.data as unknown as SuppliersResponse;
		},
	});

	const suppliers = data?.data ?? [];
	const pagination = data?.pagination;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Suppliers</h1>
				<Button
					onClick={() => {
						setEditingSupplier(null);
						setFormOpen(true);
					}}
				>
					<PlusIcon className="mr-2 size-4" />
					Add Supplier
				</Button>
			</div>

			<div className="relative max-w-sm">
				<SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
				<Input
					placeholder="Search suppliers..."
					className="pl-8"
					value={search}
					onChange={(e) => handleSearchChange(e.target.value)}
				/>
			</div>

			{isLoading ? (
				<div className="py-12 text-center text-sm text-muted-foreground">
					Loading suppliers...
				</div>
			) : suppliers.length === 0 ? (
				<div className="py-12 text-center text-sm text-muted-foreground">
					{debouncedSearch
						? "No suppliers match your search."
						: "No suppliers yet. Add your first supplier to get started."}
				</div>
			) : (
				<>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Notes</TableHead>
								<TableHead className="w-24">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{suppliers.map((supplier) => (
								<TableRow key={supplier.id}>
									<TableCell className="font-medium">{supplier.name}</TableCell>
									<TableCell className="text-muted-foreground">
										{supplier.notes || "—"}
									</TableCell>
									<TableCell>
										<div className="flex gap-1">
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() => {
													setEditingSupplier(supplier);
													setFormOpen(true);
												}}
											>
												<PencilIcon className="size-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() => {
													setDeletingSupplier(supplier);
													setDeleteOpen(true);
												}}
											>
												<Trash2Icon className="size-4" />
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

			<SupplierFormDialog
				open={formOpen}
				onOpenChange={setFormOpen}
				supplier={editingSupplier}
			/>

			{deletingSupplier && (
				<DeleteSupplierDialog
					open={deleteOpen}
					onOpenChange={setDeleteOpen}
					supplierId={deletingSupplier.id}
					supplierName={deletingSupplier.name}
				/>
			)}
		</div>
	);
}

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowDownAZ,
	ArrowUpAZ,
	ChevronDownIcon,
	ChevronRightIcon,
	PencilIcon,
	PlusIcon,
	SearchIcon,
	Trash2Icon,
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { DeleteInvoiceDialog } from "@/components/delete-invoice-dialog";
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
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/invoices/")({
	component: InvoicesPage,
});

interface InvoiceLine {
	id: number;
	invoiceId: number;
	description: string;
	unitPrice: number;
	numberOfUnits: number;
	totalAmount: number;
	serviceId: number;
	categoryId: number;
	costTypeId: number;
	createdBy: string;
	createdAt: number;
	updatedBy: string;
	updatedAt: number;
}

interface Invoice {
	id: number;
	supplierId: number;
	invoiceDate: number;
	invoiceNumber: string;
	createdBy: string;
	createdAt: number;
	updatedBy: string;
	updatedAt: number;
	lines: InvoiceLine[];
}

interface InvoicesResponse {
	data: Invoice[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

interface LookupItem {
	id: number;
	name: string;
}

function InvoicesPage() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [sortField, setSortField] = useState<
		"invoiceDate" | "invoiceNumber" | "supplierName"
	>("invoiceDate");
	const [order, setOrder] = useState<"asc" | "desc">("desc");
	const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPage(1);
		setDebouncedSearch(value);
	};

	const toggleRow = (id: number) => {
		setExpandedRows((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const handleSort = (
		field: "invoiceDate" | "invoiceNumber" | "supplierName",
	) => {
		if (sortField === field) {
			setOrder((o) => (o === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setOrder("asc");
		}
	};

	const { data, isLoading } = useQuery({
		queryKey: ["invoices", { page, search: debouncedSearch, sortField, order }],
		queryFn: async () => {
			const params: Record<string, string> = {
				page: String(page),
				limit: "20",
				sort: sortField,
				order,
			};
			if (debouncedSearch) params.search = debouncedSearch;
			const res = await eden.api.invoices.get({ query: params });
			if (res.error) throw res.error;
			return res.data as unknown as InvoicesResponse;
		},
	});

	const { data: suppliers = [] } = useQuery({
		queryKey: ["suppliers"],
		queryFn: async () => {
			const res = await eden.api.suppliers.get({
				query: { limit: "100" },
			});
			if (res.error) throw res.error;
			return (res.data as unknown as { data: LookupItem[] }).data;
		},
	});

	const { data: services = [] } = useQuery({
		queryKey: ["services"],
		queryFn: async () => {
			const res = await eden.api.services.get({
				query: { limit: "100" },
			});
			if (res.error) throw res.error;
			return (res.data as unknown as { data: LookupItem[] }).data;
		},
	});

	const { data: categories = [] } = useQuery({
		queryKey: ["categories"],
		queryFn: async () => {
			const res = await eden.api.categories.get({
				query: { limit: "100" },
			});
			if (res.error) throw res.error;
			return (res.data as unknown as { data: LookupItem[] }).data;
		},
	});

	const { data: costTypes = [] } = useQuery({
		queryKey: ["costTypes"],
		queryFn: async () => {
			const res = await eden.api["cost-types"].get({
				query: { limit: "100" },
			});
			if (res.error) throw res.error;
			return (res.data as unknown as { data: LookupItem[] }).data;
		},
	});

	const supplierMap = useMemo(
		() => new Map(suppliers.map((s) => [s.id, s.name])),
		[suppliers],
	);
	const serviceMap = useMemo(
		() => new Map(services.map((s) => [s.id, s.name])),
		[services],
	);
	const categoryMap = useMemo(
		() => new Map(categories.map((c) => [c.id, c.name])),
		[categories],
	);
	const costTypeMap = useMemo(
		() => new Map(costTypes.map((ct) => [ct.id, ct.name])),
		[costTypes],
	);

	const invoices = data?.data ?? [];
	const pagination = data?.pagination;

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "EUR",
		}).format(amount / 100);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Invoices</h1>
				<Link to="/invoices/new">
					<Button>
						<PlusIcon className="mr-2 size-4" />
						Add Invoice
					</Button>
				</Link>
			</div>

			<div className="flex items-center justify-between">
				<div className="relative max-w-sm">
					<SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
					<Input
						placeholder="Search by invoice number, supplier, or date..."
						className="pl-8"
						value={search}
						onChange={(e) => handleSearchChange(e.target.value)}
					/>
				</div>
			</div>

			{isLoading ? (
				<div className="py-12 text-center text-sm text-muted-foreground">
					Loading invoices...
				</div>
			) : invoices.length === 0 ? (
				<div className="py-12 text-center text-sm text-muted-foreground">
					{debouncedSearch
						? "No invoices match your search."
						: "No invoices yet. Add your first invoice to get started."}
				</div>
			) : (
				<>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-8" />
								<TableHead>
									<button
										type="button"
										className="inline-flex items-center gap-1 hover:text-foreground"
										onClick={() => handleSort("invoiceDate")}
									>
										Invoice Date
										{sortField === "invoiceDate" ? (
											order === "asc" ? (
												<ArrowDownAZ className="size-3" />
											) : (
												<ArrowUpAZ className="size-3" />
											)
										) : (
											<ArrowUpAZ className="size-3 opacity-50" />
										)}
									</button>
								</TableHead>
								<TableHead>
									<button
										type="button"
										className="inline-flex items-center gap-1 hover:text-foreground"
										onClick={() => handleSort("supplierName")}
									>
										Supplier
										{sortField === "supplierName" ? (
											order === "asc" ? (
												<ArrowDownAZ className="size-3" />
											) : (
												<ArrowUpAZ className="size-3" />
											)
										) : (
											<ArrowUpAZ className="size-3 opacity-50" />
										)}
									</button>
								</TableHead>
								<TableHead>
									<button
										type="button"
										className="inline-flex items-center gap-1 hover:text-foreground"
										onClick={() => handleSort("invoiceNumber")}
									>
										Invoice Number
										{sortField === "invoiceNumber" ? (
											order === "asc" ? (
												<ArrowDownAZ className="size-3" />
											) : (
												<ArrowUpAZ className="size-3" />
											)
										) : (
											<ArrowUpAZ className="size-3 opacity-50" />
										)}
									</button>
								</TableHead>
								<TableHead className="w-24">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{invoices.map((invoice) => (
								<Fragment key={invoice.id}>
									<TableRow>
										<TableCell>
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() => toggleRow(invoice.id)}
											>
												{expandedRows.has(invoice.id) ? (
													<ChevronDownIcon className="size-4" />
												) : (
													<ChevronRightIcon className="size-4" />
												)}
											</Button>
										</TableCell>
										<TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
										<TableCell>
											{supplierMap.get(invoice.supplierId) ??
												`Supplier #${invoice.supplierId}`}
										</TableCell>
										<TableCell className="font-medium">
											{invoice.invoiceNumber}
										</TableCell>
										<TableCell>
											<div className="flex gap-1">
												<Link
													to={`/invoices/$invoiceId/edit`}
													params={{ invoiceId: String(invoice.id) }}
												>
													<Button variant="ghost" size="icon-sm">
														<PencilIcon className="size-4" />
													</Button>
												</Link>
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() => {
														setDeletingInvoice(invoice);
														setDeleteOpen(true);
													}}
												>
													<Trash2Icon className="size-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
									{expandedRows.has(invoice.id) && invoice.lines.length > 0 && (
										<TableRow key={`${invoice.id}-lines`}>
											<TableCell colSpan={5} className="bg-muted/50 p-0">
												<Table>
													<TableHeader>
														<TableRow>
															<TableHead>Description</TableHead>
															<TableHead className="text-right">
																Unit Price
															</TableHead>
															<TableHead className="text-right">
																Units
															</TableHead>
															<TableHead className="text-right">
																Total
															</TableHead>
															<TableHead>Service</TableHead>
															<TableHead>Category</TableHead>
															<TableHead>Cost Type</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{invoice.lines.map((line) => (
															<TableRow key={line.id}>
																<TableCell>{line.description}</TableCell>
																<TableCell className="text-right">
																	{formatCurrency(line.unitPrice)}
																</TableCell>
																<TableCell className="text-right">
																	{line.numberOfUnits}
																</TableCell>
																<TableCell className="text-right font-medium">
																	{formatCurrency(line.totalAmount)}
																</TableCell>
																<TableCell>
																	{serviceMap.get(line.serviceId) ??
																		`Service #${line.serviceId}`}
																</TableCell>
																<TableCell>
																	{categoryMap.get(line.categoryId) ??
																		`Category #${line.categoryId}`}
																</TableCell>
																<TableCell>
																	{costTypeMap.get(line.costTypeId) ??
																		`Cost Type #${line.costTypeId}`}
																</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</TableCell>
										</TableRow>
									)}
								</Fragment>
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

			{deletingInvoice && (
				<DeleteInvoiceDialog
					open={deleteOpen}
					onOpenChange={setDeleteOpen}
					invoiceId={deletingInvoice.id}
					invoiceNumber={deletingInvoice.invoiceNumber}
				/>
			)}
		</div>
	);
}

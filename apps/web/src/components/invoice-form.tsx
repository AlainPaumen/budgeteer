import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
	ChevronDownIcon,
	ChevronRightIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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

const invoiceLineSchema = z.object({
	description: z.string().min(1, "Description is required").max(500),
	unit_price: z.number().positive("Unit price must be positive"),
	number_of_units: z
		.number()
		.int()
		.positive("Number of units must be positive"),
	total_amount: z.number().optional(),
	start_date: z.string().min(1, "Start date is required"),
	end_date: z.string().optional(),
	service_id: z.number().int().positive("Service is required"),
	category_id: z.number().int().positive("Category is required"),
	cost_type_id: z.number().int().positive("Cost type is required"),
});

const invoiceSchema = z
	.object({
		supplier_id: z.number().int().positive("Supplier is required"),
		invoice_date: z.string().min(1, "Invoice date is required"),
		invoice_number: z.string().min(1, "Invoice number is required").max(100),
		lines: z
			.array(invoiceLineSchema)
			.min(1, "At least one invoice line is required"),
	})
	.refine(
		(data) => {
			return data.lines.every((line) => {
				if (line.start_date && line.end_date) {
					return new Date(line.end_date) >= new Date(line.start_date);
				}
				return true;
			});
		},
		{
			message: "End date must be after start date",
			path: ["lines"],
		},
	);

type InvoiceLineFormValues = z.infer<typeof invoiceLineSchema>;
type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface Supplier {
	id: number;
	name: string;
}

interface Service {
	id: number;
	name: string;
}

interface Category {
	id: number;
	name: string;
}

interface CostType {
	id: number;
	name: string;
}

interface RecentInvoiceLine {
	id: number;
	invoiceId: number;
	description: string;
	unitPrice: number;
	numberOfUnits: number;
	totalAmount: number;
	startDate: number;
	endDate: number;
	serviceId: number;
	categoryId: number;
	costTypeId: number;
	createdBy: string;
	createdAt: number;
	updatedBy: string;
	updatedAt: number;
}

interface RecentInvoice {
	id: number;
	supplierId: number;
	invoiceDate: number;
	invoiceNumber: string;
	createdBy: string;
	createdAt: number;
	updatedBy: string;
	updatedAt: number;
	lines: RecentInvoiceLine[];
}

interface InvoiceFormProps {
	invoiceId?: number;
	initialData?: {
		supplierId: number;
		invoiceDate: string;
		invoiceNumber: string;
		lines: InvoiceLineFormValues[];
	};
}

export function InvoiceForm({ invoiceId, initialData }: InvoiceFormProps) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const isEditing = !!invoiceId;

	const [expandedRecentInvoices, setExpandedRecentInvoices] = useState<
		Set<number>
	>(new Set());

	const [selectedSupplierId, setSelectedSupplierId] = useState<number>(0);

	const [lineErrors, setLineErrors] = useState<
		Record<number, Record<string, string>>
	>({});

	const [invoiceErrors, setInvoiceErrors] = useState<Record<string, string>>(
		{},
	);

	const { data: suppliers = [], error: suppliersError } = useQuery({
		queryKey: ["suppliers"],
		queryFn: async () => {
			const res = await eden.api.suppliers.get({
				query: { limit: "100", is_active: "true" },
			});
			if (res.error) throw res.error;
			return (res.data as unknown as { data: Supplier[] }).data;
		},
	});

	const { data: services = [], error: servicesError } = useQuery({
		queryKey: ["services"],
		queryFn: async () => {
			const res = await eden.api.services.get({
				query: { limit: "100", is_active: "true" },
			});
			if (res.error) throw res.error;
			return (res.data as unknown as { data: Service[] }).data;
		},
	});

	const { data: categories = [], error: categoriesError } = useQuery({
		queryKey: ["categories"],
		queryFn: async () => {
			const res = await eden.api.categories.get({
				query: { limit: "100", is_active: "true" },
			});
			if (res.error) throw res.error;
			return (res.data as unknown as { data: Category[] }).data;
		},
	});

	const { data: costTypes = [], error: costTypesError } = useQuery({
		queryKey: ["costTypes"],
		queryFn: async () => {
			const res = await eden.api["cost-types"].get({
				query: { limit: "100", is_active: "true" },
			});
			if (res.error) throw res.error;
			return (res.data as unknown as { data: CostType[] }).data;
		},
	});

	const defaultValues: InvoiceFormValues = {
		supplier_id: initialData?.supplierId ?? 0,
		invoice_date: initialData?.invoiceDate ?? "",
		invoice_number: initialData?.invoiceNumber ?? "",
		lines: initialData?.lines
			? initialData.lines.map((line) => ({
					...line,
					unit_price: line.unit_price / 100,
					total_amount: (line.total_amount ?? 0) / 100,
					start_date: line.start_date
						? new Date(line.start_date).toISOString().split("T")[0]
						: "",
					end_date: line.end_date
						? new Date(line.end_date).toISOString().split("T")[0]
						: "",
				}))
			: [],
	};

	const createMutation = useMutation({
		mutationFn: async (data: InvoiceFormValues) => {
			const apiData = {
				...data,
				lines: data.lines.map((line) => ({
					...line,
					unit_price: Math.round(line.unit_price * 100),
					number_of_units: line.number_of_units,
					total_amount: Math.round((line.total_amount ?? 0) * 100),
					start_date: line.start_date,
					end_date: line.end_date || line.start_date,
				})),
			};
			console.log("Creating invoice:", apiData);
			const res = await eden.api.invoices.post(apiData);
			console.log("API response:", res);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["invoices"] });
			navigate({ to: "/invoices" });
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: InvoiceFormValues) => {
			const apiData = {
				...data,
				lines: data.lines.map((line) => ({
					...line,
					unit_price: Math.round(line.unit_price * 100),
					number_of_units: line.number_of_units,
					total_amount: Math.round((line.total_amount ?? 0) * 100),
					start_date: line.start_date,
					end_date: line.end_date || line.start_date,
				})),
			};
			const res = await eden.api
				.invoices({ id: invoiceId ?? 0 })
				.patch(apiData);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["invoices"] });
			navigate({ to: "/invoices" });
		},
	});

	const form = useForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			console.log("Form submitted with value:", value);

			const invoiceResult = invoiceSchema.safeParse(value);
			const lineErrors: Record<number, Record<string, string>> = {};
			const invoiceErrors: Record<string, string> = {};

			if (!invoiceResult.success) {
				console.log("Validation errors:", invoiceResult.error.issues);
				invoiceResult.error.issues.forEach((issue) => {
					const field = issue.path[0] as string;
					if (field === "lines" && typeof issue.path[1] === "number") {
						const lineIndex = issue.path[1];
						const lineField = issue.path[2] as string;
						if (lineField) {
							if (!lineErrors[lineIndex]) lineErrors[lineIndex] = {};
							lineErrors[lineIndex][lineField] = issue.message;
						}
					} else if (field && issue.path.length === 1) {
						invoiceErrors[field] = issue.message;
					}
				});
			}

			setLineErrors(lineErrors);
			setInvoiceErrors(invoiceErrors);

			if (!invoiceResult.success) {
				return;
			}

			if (isEditing) {
				await updateMutation.mutateAsync(value);
			} else {
				await createMutation.mutateAsync(value);
			}
		},
	});

	const { data: recentInvoices = [] } = useQuery({
		queryKey: ["invoices", "recent", selectedSupplierId],
		queryFn: async () => {
			if (!selectedSupplierId) return [];
			const res = await fetch(
				`http://localhost:3000/api/invoices/recent?supplierId=${selectedSupplierId}`,
				{ credentials: "include" },
			);
			if (!res.ok) throw new Error("Failed to fetch recent invoices");
			return (await res.json()) as RecentInvoice[];
		},
		enabled: selectedSupplierId > 0,
	});

	useEffect(() => {
		if (initialData) {
			form.setFieldValue("supplier_id", initialData.supplierId);
			setSelectedSupplierId(initialData.supplierId);
			form.setFieldValue("invoice_date", initialData.invoiceDate);
			form.setFieldValue("invoice_number", initialData.invoiceNumber);
			form.setFieldValue(
				"lines",
				initialData.lines.map((line) => ({
					...line,
					unit_price: line.unit_price / 100,
					total_amount: (line.total_amount ?? 0) / 100,
					start_date: line.start_date
						? new Date(line.start_date).toISOString().split("T")[0]
						: "",
					end_date: line.end_date
						? new Date(line.end_date).toISOString().split("T")[0]
						: "",
				})),
			);
		}
	}, [initialData, form]);

	const error = createMutation.error || updateMutation.error;

	const toggleRecentInvoice = (id: number) => {
		setExpandedRecentInvoices((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const copyLineFromRecent = (line: RecentInvoiceLine) => {
		const currentLines = form.getFieldValue("lines");
		form.setFieldValue("lines", [
			...currentLines,
			{
				description: line.description,
				unit_price: line.unitPrice / 100,
				number_of_units: line.numberOfUnits,
				total_amount: line.totalAmount / 100,
				start_date: line.startDate
					? new Date(line.startDate).toISOString().split("T")[0]
					: "",
				end_date: line.endDate
					? new Date(line.endDate).toISOString().split("T")[0]
					: "",
				service_id: line.serviceId,
				category_id: line.categoryId,
				cost_type_id: line.costTypeId,
			},
		]);
	};

	const addLine = () => {
		const currentLines = form.getFieldValue("lines");
		form.setFieldValue("lines", [
			...currentLines,
			{
				description: "",
				unit_price: 0,
				number_of_units: 0,
				total_amount: 0,
				start_date: "",
				end_date: "",
				service_id: 0,
				category_id: 0,
				cost_type_id: 0,
			},
		]);
	};

	const removeLine = (index: number) => {
		const currentLines = form.getFieldValue("lines");
		form.setFieldValue(
			"lines",
			currentLines.filter((_, i) => i !== index),
		);
	};

	const updateLineTotal = (
		index: number,
		unitPrice: number,
		numberOfUnits: number,
	) => {
		const lines = form.getFieldValue("lines");
		const updatedLines = [...lines];
		updatedLines[index] = {
			...updatedLines[index],
			total_amount: unitPrice * numberOfUnits,
		};
		form.setFieldValue("lines", updatedLines);
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "EUR",
		}).format(amount);
	};

	return (
		<div className="space-y-6">
			{(suppliersError ||
				servicesError ||
				categoriesError ||
				costTypesError) && (
				<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					Failed to load data. Please check if the API is running.
				</div>
			)}

			{error && (
				<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{"value" in error &&
					error.value &&
					typeof error.value === "object" &&
					"error" in error.value
						? String(error.value.error)
						: "message" in error
							? String(error.message)
							: "An error occurred"}
				</div>
			)}

			<form.Subscribe
				selector={(state) => state.errors}
				// biome-ignore lint/correctness/noChildrenProp: TanStack Form render prop
				children={(errors) =>
					errors.length > 0 && (
						<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{errors.map((err, index) => {
								let msg = "Validation error";
								if (typeof err === "object" && err !== null) {
									const issue = err as Record<string, unknown>;
									if (typeof issue.message === "string") {
										msg = issue.message;
									} else if (Array.isArray(issue.issues)) {
										const messages = issue.issues
											.map((i: Record<string, unknown>) =>
												typeof i.message === "string" ? i.message : null,
											)
											.filter(Boolean);
										if (messages.length > 0) msg = messages.join(", ");
									}
								}
								// biome-ignore lint/suspicious/noArrayIndexKey: validation error list is stable
								return <div key={index}>{msg}</div>;
							})}
						</div>
					)
				}
			/>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				noValidate
				className="space-y-6"
			>
				<div className="space-y-4">
					<h2 className="text-lg font-semibold">Supplier</h2>
					<form.Field
						name="supplier_id"
						// biome-ignore lint/correctness/noChildrenProp: TanStack Form render prop
						children={(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid || !!invoiceErrors.supplier_id}>
									<FieldLabel htmlFor="supplier_id" className="required">
										Supplier
									</FieldLabel>
									<Select
										value={field.state.value ? String(field.state.value) : ""}
										onValueChange={(value) => {
											const numValue = Number(value);
											field.handleChange(numValue);
											setSelectedSupplierId(numValue);
											if (invoiceErrors.supplier_id) {
												setInvoiceErrors((prev) => {
													const next = { ...prev };
													delete next.supplier_id;
													return next;
												});
											}
										}}
										items={suppliers.map((s) => ({
											value: String(s.id),
											label: s.name,
										}))}
									>
										<SelectTrigger
											className="w-full"
											aria-invalid={isInvalid || !!invoiceErrors.supplier_id}
										>
											<SelectValue placeholder="Select a supplier" />
										</SelectTrigger>
										<SelectContent>
											{suppliers.map((supplier) => (
												<SelectItem
													key={supplier.id}
													value={String(supplier.id)}
												>
													{supplier.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{invoiceErrors.supplier_id && (
										<p className="text-xs text-destructive">
											{invoiceErrors.supplier_id}
										</p>
									)}
								</Field>
							);
						}}
					/>

					{selectedSupplierId > 0 && (
						<div className="space-y-2">
							<h3 className="text-sm font-medium text-muted-foreground">
								10 Most Recent Invoices
							</h3>
							{recentInvoices.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No invoices for this supplier.
								</p>
							) : (
								<div className="border rounded-md">
									{recentInvoices.map((invoice) => (
										<div key={invoice.id} className="border-b last:border-b-0">
											<div className="flex items-center gap-2 px-3 py-2">
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() => toggleRecentInvoice(invoice.id)}
												>
													{expandedRecentInvoices.has(invoice.id) ? (
														<ChevronDownIcon className="size-4" />
													) : (
														<ChevronRightIcon className="size-4" />
													)}
												</Button>
												<span className="text-sm font-medium">
													{invoice.invoiceNumber}
												</span>
												<span className="text-sm text-muted-foreground">
													{formatDate(invoice.invoiceDate)}
												</span>
											</div>
											{expandedRecentInvoices.has(invoice.id) &&
												invoice.lines.length > 0 && (
													<div className="bg-muted/50 px-3 py-2">
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
																	<TableHead className="w-16" />
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
																			<Button
																				variant="ghost"
																				size="sm"
																				onClick={() => copyLineFromRecent(line)}
																			>
																				Copy
																			</Button>
																		</TableCell>
																	</TableRow>
																))}
															</TableBody>
														</Table>
													</div>
												)}
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>

				<div className="space-y-4">
					<h2 className="text-lg font-semibold">Invoice Details</h2>
					<div className="grid grid-cols-2 gap-4">
						<form.Field
							name="invoice_date"
							// biome-ignore lint/correctness/noChildrenProp: TanStack Form render prop
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field
										data-invalid={isInvalid || !!invoiceErrors.invoice_date}
									>
										<FieldLabel htmlFor="invoice_date" className="required">
											Invoice Date
										</FieldLabel>
										<DatePicker
											value={field.state.value}
											onChange={(date) => {
												field.handleChange(date);
												if (invoiceErrors.invoice_date) {
													setInvoiceErrors((prev) => {
														const next = { ...prev };
														delete next.invoice_date;
														return next;
													});
												}
											}}
											disabled={isEditing}
											className={
												isInvalid || invoiceErrors.invoice_date
													? "border-destructive"
													: ""
											}
										/>
										{invoiceErrors.invoice_date && (
											<p className="text-xs text-destructive">
												{invoiceErrors.invoice_date}
											</p>
										)}
									</Field>
								);
							}}
						/>

						<form.Field
							name="invoice_number"
							// biome-ignore lint/correctness/noChildrenProp: TanStack Form render prop
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field
										data-invalid={isInvalid || !!invoiceErrors.invoice_number}
									>
										<FieldLabel htmlFor="invoice_number" className="required">
											Invoice Number
										</FieldLabel>
										<Input
											id="invoice_number"
											name="invoice_number"
											placeholder="e.g. INV-2024-001"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => {
												field.handleChange(e.target.value);
												if (invoiceErrors.invoice_number) {
													setInvoiceErrors((prev) => {
														const next = { ...prev };
														delete next.invoice_number;
														return next;
													});
												}
											}}
											aria-invalid={isInvalid || !!invoiceErrors.invoice_number}
											className={
												invoiceErrors.invoice_number ? "border-destructive" : ""
											}
										/>
										{invoiceErrors.invoice_number && (
											<p className="text-xs text-destructive">
												{invoiceErrors.invoice_number}
											</p>
										)}
									</Field>
								);
							}}
						/>
					</div>
				</div>

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold">Invoice Lines</h2>
						<Button type="button" variant="outline" size="sm" onClick={addLine}>
							<PlusIcon className="mr-2 size-4" />
							Add Line
						</Button>
					</div>

					<form.Field
						name="lines"
						// biome-ignore lint/correctness/noChildrenProp: TanStack Form render prop
						children={(field) => {
							const lines = field.state.value;
							return (
								<div className="space-y-4">
									{lines.length === 0 && (
										<div className="py-8 text-center text-sm text-muted-foreground border rounded-md">
											No invoice lines. Click "Add Line" to add one.
										</div>
									)}
									{lines.map((line, index) => {
										const errors = lineErrors[index] || {};
										const hasErrors = Object.keys(errors).length > 0;
										return (
											<div
												// biome-ignore lint/suspicious/noArrayIndexKey: form fields don't reorder
												key={index}
												className="border rounded-md p-4 space-y-3"
											>
												<div className="grid grid-cols-[1fr_120px_100px_120px_40px] gap-2 items-end">
													<Field>
														<FieldLabel>Description</FieldLabel>
														<Input
															value={line.description}
															aria-invalid={!!errors.description}
															className={
																errors.description ? "border-destructive" : ""
															}
															onChange={(e) => {
																const lines = form.getFieldValue("lines");
																const updatedLines = [...lines];
																updatedLines[index] = {
																	...updatedLines[index],
																	description: e.target.value,
																};
																form.setFieldValue("lines", updatedLines);
																if (lineErrors[index]?.description) {
																	setLineErrors((prev) => {
																		const next = { ...prev };
																		if (next[index]) {
																			delete next[index].description;
																			if (Object.keys(next[index]).length === 0)
																				delete next[index];
																		}
																		return next;
																	});
																}
															}}
														/>
													</Field>

													<Field>
														<FieldLabel>Unit Price</FieldLabel>
														<div className="relative">
															<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
																€
															</span>
															<Input
																type="number"
																value={line.unit_price || ""}
																aria-invalid={!!errors.unit_price}
																className={
																	errors.unit_price
																		? "border-destructive pl-6"
																		: "pl-6"
																}
																onChange={(e) => {
																	const value = Number(e.target.value);
																	const lines = form.getFieldValue("lines");
																	const updatedLines = [...lines];
																	updatedLines[index] = {
																		...updatedLines[index],
																		unit_price: value,
																	};
																	form.setFieldValue("lines", updatedLines);
																	updateLineTotal(
																		index,
																		value,
																		line.number_of_units,
																	);
																	if (lineErrors[index]?.unit_price) {
																		setLineErrors((prev) => {
																			const next = { ...prev };
																			if (next[index]) {
																				delete next[index].unit_price;
																				if (
																					Object.keys(next[index]).length === 0
																				)
																					delete next[index];
																			}
																			return next;
																		});
																	}
																}}
															/>
														</div>
													</Field>

													<Field>
														<FieldLabel>Units</FieldLabel>
														<Input
															type="number"
															value={line.number_of_units || ""}
															aria-invalid={!!errors.number_of_units}
															className={
																errors.number_of_units
																	? "border-destructive"
																	: ""
															}
															onChange={(e) => {
																const value = Number(e.target.value);
																const lines = form.getFieldValue("lines");
																const updatedLines = [...lines];
																updatedLines[index] = {
																	...updatedLines[index],
																	number_of_units: value,
																};
																form.setFieldValue("lines", updatedLines);
																updateLineTotal(index, line.unit_price, value);
																if (lineErrors[index]?.number_of_units) {
																	setLineErrors((prev) => {
																		const next = { ...prev };
																		if (next[index]) {
																			delete next[index].number_of_units;
																			if (Object.keys(next[index]).length === 0)
																				delete next[index];
																		}
																		return next;
																	});
																}
															}}
														/>
													</Field>

													<Field>
														<FieldLabel>Total</FieldLabel>
														<Input
															type="text"
															value={
																line.total_amount
																	? formatCurrency(line.total_amount)
																	: ""
															}
															readOnly
															className="bg-muted"
														/>
													</Field>

													<Button
														type="button"
														variant="ghost"
														size="icon-sm"
														className="mb-0.5"
														onClick={() => removeLine(index)}
													>
														<Trash2Icon className="size-4" />
													</Button>
												</div>

												{hasErrors &&
													(errors.description ||
														errors.unit_price ||
														errors.number_of_units) && (
														<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-destructive">
															{errors.description && (
																<span>{errors.description}</span>
															)}
															{errors.unit_price && (
																<span>{errors.unit_price}</span>
															)}
															{errors.number_of_units && (
																<span>{errors.number_of_units}</span>
															)}
														</div>
													)}

												<div className="grid grid-cols-2 gap-2">
													<Field>
														<FieldLabel>Start Date</FieldLabel>
														<DatePicker
															value={line.start_date || ""}
															onChange={(date) => {
																const lines = form.getFieldValue("lines");
																const updatedLines = [...lines];
																updatedLines[index] = {
																	...updatedLines[index],
																	start_date: date,
																};
																form.setFieldValue("lines", updatedLines);
																if (lineErrors[index]?.start_date) {
																	setLineErrors((prev) => {
																		const next = { ...prev };
																		if (next[index]) {
																			delete next[index].start_date;
																			if (Object.keys(next[index]).length === 0)
																				delete next[index];
																		}
																		return next;
																	});
																}
															}}
															className={
																errors.start_date ? "border-destructive" : ""
															}
														/>
													</Field>

													<Field>
														<FieldLabel>End Date</FieldLabel>
														<DatePicker
															value={line.end_date || ""}
															onChange={(date) => {
																const lines = form.getFieldValue("lines");
																const updatedLines = [...lines];
																updatedLines[index] = {
																	...updatedLines[index],
																	end_date: date,
																};
																form.setFieldValue("lines", updatedLines);
																if (lineErrors[index]?.end_date) {
																	setLineErrors((prev) => {
																		const next = { ...prev };
																		if (next[index]) {
																			delete next[index].end_date;
																			if (Object.keys(next[index]).length === 0)
																				delete next[index];
																		}
																		return next;
																	});
																}
															}}
															className={
																errors.end_date ? "border-destructive" : ""
															}
														/>
													</Field>
												</div>

												{hasErrors &&
													(errors.start_date || errors.end_date) && (
														<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-destructive">
															{errors.start_date && (
																<span>{errors.start_date}</span>
															)}
															{errors.end_date && (
																<span>{errors.end_date}</span>
															)}
														</div>
													)}

												<div className="grid grid-cols-3 gap-2">
													<Field>
														<Select
															value={
																line.service_id ? String(line.service_id) : ""
															}
															onValueChange={(value) => {
																const lines = form.getFieldValue("lines");
																const updatedLines = [...lines];
																updatedLines[index] = {
																	...updatedLines[index],
																	service_id: Number(value),
																};
																form.setFieldValue("lines", updatedLines);
																if (lineErrors[index]?.service_id) {
																	setLineErrors((prev) => {
																		const next = { ...prev };
																		if (next[index]) {
																			delete next[index].service_id;
																			if (Object.keys(next[index]).length === 0)
																				delete next[index];
																		}
																		return next;
																	});
																}
															}}
															items={services.map((s) => ({
																value: String(s.id),
																label: s.name,
															}))}
														>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Service" />
															</SelectTrigger>
															<SelectContent>
																{services.map((service) => (
																	<SelectItem
																		key={service.id}
																		value={String(service.id)}
																	>
																		{service.name}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</Field>

													<Field>
														<Select
															value={
																line.category_id ? String(line.category_id) : ""
															}
															onValueChange={(value) => {
																const lines = form.getFieldValue("lines");
																const updatedLines = [...lines];
																updatedLines[index] = {
																	...updatedLines[index],
																	category_id: Number(value),
																};
																form.setFieldValue("lines", updatedLines);
																if (lineErrors[index]?.category_id) {
																	setLineErrors((prev) => {
																		const next = { ...prev };
																		if (next[index]) {
																			delete next[index].category_id;
																			if (Object.keys(next[index]).length === 0)
																				delete next[index];
																		}
																		return next;
																	});
																}
															}}
															items={categories.map((c) => ({
																value: String(c.id),
																label: c.name,
															}))}
														>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Category" />
															</SelectTrigger>
															<SelectContent>
																{categories.map((category) => (
																	<SelectItem
																		key={category.id}
																		value={String(category.id)}
																	>
																		{category.name}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</Field>

													<Field>
														<Select
															value={
																line.cost_type_id
																	? String(line.cost_type_id)
																	: ""
															}
															onValueChange={(value) => {
																const lines = form.getFieldValue("lines");
																const updatedLines = [...lines];
																updatedLines[index] = {
																	...updatedLines[index],
																	cost_type_id: Number(value),
																};
																form.setFieldValue("lines", updatedLines);
																if (lineErrors[index]?.cost_type_id) {
																	setLineErrors((prev) => {
																		const next = { ...prev };
																		if (next[index]) {
																			delete next[index].cost_type_id;
																			if (Object.keys(next[index]).length === 0)
																				delete next[index];
																		}
																		return next;
																	});
																}
															}}
															items={costTypes.map((ct) => ({
																value: String(ct.id),
																label: ct.name,
															}))}
														>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Cost Type" />
															</SelectTrigger>
															<SelectContent>
																{costTypes.map((costType) => (
																	<SelectItem
																		key={costType.id}
																		value={String(costType.id)}
																	>
																		{costType.name}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</Field>
												</div>

												{hasErrors &&
													(errors.service_id ||
														errors.category_id ||
														errors.cost_type_id) && (
														<div className="flex gap-x-4 text-xs text-destructive">
															{errors.service_id && (
																<span>{errors.service_id}</span>
															)}
															{errors.category_id && (
																<span>{errors.category_id}</span>
															)}
															{errors.cost_type_id && (
																<span>{errors.cost_type_id}</span>
															)}
														</div>
													)}
											</div>
										);
									})}
								</div>
							);
						}}
					/>
				</div>

				<div className="flex justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate({ to: "/invoices" })}
					>
						Cancel
					</Button>
					<form.Subscribe
						selector={(state) => ({
							isSubmitting: state.isSubmitting,
							lines: state.values.lines,
						})}
						// biome-ignore lint/correctness/noChildrenProp: TanStack Form render prop
						children={({ isSubmitting, lines }) => (
							<Button
								type="submit"
								disabled={isSubmitting || !lines || lines.length === 0}
							>
								{isSubmitting
									? isEditing
										? "Saving..."
										: "Creating..."
									: isEditing
										? "Save Changes"
										: "Create Invoice"}
							</Button>
						)}
					/>
				</div>
			</form>
		</div>
	);
}

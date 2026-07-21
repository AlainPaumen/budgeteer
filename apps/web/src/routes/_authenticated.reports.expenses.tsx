import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { BarChart3Icon, DownloadIcon } from "lucide-react";
import { useState } from "react";
import type { PivotData } from "@/components/expense-pivot-table";
import { ExpensePivotTable } from "@/components/expense-pivot-table";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { YearPicker } from "@/components/year-picker";
import { eden } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_authenticated/reports/expenses")({
	component: ExpensesPage,
	beforeLoad: async () => {
		try {
			const { data } = await authClient.getSession();
			if (!data?.user) {
				throw redirect({
					to: "/auth/login",
					search: { redirect: window.location.pathname },
				});
			}
		} catch (_e) {
			throw redirect({
				to: "/auth/login",
				search: { redirect: window.location.pathname },
			});
		}
	},
});

interface Branch {
	id: number;
	name: string;
	isActive: boolean;
}

interface Supplier {
	id: number;
	name: string;
	isActive: boolean;
}

interface CostType {
	id: number;
	name: string;
	isFixed: boolean;
	isCapex: boolean;
	isActive: boolean;
}

function ExpensesPage() {
	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState(currentYear);

	const { data: branches, isLoading: branchesLoading } = useQuery({
		queryKey: ["branches"],
		queryFn: async () => {
			const res = await eden.api.branches.get({ query: { limit: "100" } });
			return (res.data as unknown as Branch[]).filter((b) => b.isActive);
		},
	});

	const { data: suppliers, isLoading: suppliersLoading } = useQuery({
		queryKey: ["suppliers"],
		queryFn: async () => {
			const res = await eden.api.suppliers.get({ query: { limit: "100" } });
			return (res.data as unknown as Supplier[]).filter((s) => s.isActive);
		},
	});

	const { data: costTypes, isLoading: costTypesLoading } = useQuery({
		queryKey: ["cost-types"],
		queryFn: async () => {
			const res = await eden.api["cost-types"].get({ query: { limit: "100" } });
			return (res.data as unknown as CostType[]).filter((c) => c.isActive);
		},
	});

	const { data: pivotData, isLoading: pivotLoading } = useQuery({
		queryKey: ["expense-pivot", year],
		queryFn: async () => {
			const res = await eden.api.reports.expenses.get({
				query: { year },
			});
			return res.data as PivotData;
		},
	});

	const handleBranchChange = (_value: string | null) => {
		// TODO: Update search params
	};

	const handleSupplierChange = (_value: string | null) => {
		// TODO: Update search params
	};

	const handleCostTypeChange = (_value: string | null) => {
		// TODO: Update search params
	};

	const exportCSV = () => {
		if (!pivotData) return;

		const monthNames = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		];

		const headers = ["Service", "Category", ...monthNames, "Total"].join(",");

		const rows = [headers];

		for (const service of pivotData.services) {
			for (const category of service.categories) {
				const row = [
					service.serviceName,
					category.categoryName,
					...category.months.map((m: number) => m.toFixed(2)),
					category.total.toFixed(2),
				].join(",");
				rows.push(row);
			}
		}

		const csvContent = rows.join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `expenses-${pivotData.year}.csv`);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	if (pivotLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	if (!pivotData || pivotData.services.length === 0) {
		return (
			<div className="space-y-6">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div className="flex items-center gap-4">
						<YearPicker value={year} onChange={setYear} />
						<Select onValueChange={handleBranchChange}>
							<SelectTrigger className="w-48">
								<SelectValue placeholder="All branches" />
							</SelectTrigger>
							<SelectContent>
								{branchesLoading ? (
									<SelectItem value="loading">Loading branches...</SelectItem>
								) : (
									<>
										<SelectItem value="all">All branches</SelectItem>
										{branches?.map((branch) => (
											<SelectItem key={branch.id} value={branch.id.toString()}>
												{branch.name}
											</SelectItem>
										))}
									</>
								)}
							</SelectContent>
						</Select>
						<Select onValueChange={handleSupplierChange}>
							<SelectTrigger className="w-48">
								<SelectValue placeholder="All suppliers" />
							</SelectTrigger>
							<SelectContent>
								{suppliersLoading ? (
									<SelectItem value="loading">Loading suppliers...</SelectItem>
								) : (
									<>
										<SelectItem value="all">All suppliers</SelectItem>
										{suppliers?.map((supplier) => (
											<SelectItem
												key={supplier.id}
												value={supplier.id.toString()}
											>
												{supplier.name}
											</SelectItem>
										))}
									</>
								)}
							</SelectContent>
						</Select>
						<Select onValueChange={handleCostTypeChange}>
							<SelectTrigger className="w-48">
								<SelectValue placeholder="All cost types" />
							</SelectTrigger>
							<SelectContent>
								{costTypesLoading ? (
									<SelectItem value="loading">Loading cost types...</SelectItem>
								) : (
									<>
										<SelectItem value="all">All cost types</SelectItem>
										{costTypes?.map((costType) => (
											<SelectItem
												key={costType.id}
												value={costType.id.toString()}
											>
												{costType.name}
											</SelectItem>
										))}
									</>
								)}
							</SelectContent>
						</Select>
					</div>
					<Button onClick={exportCSV}>
						<DownloadIcon className="h-4 w-4 mr-2" />
						Export CSV
					</Button>
				</div>
				<div className="flex flex-col items-center justify-center py-12">
					<BarChart3Icon className="h-12 w-12 text-muted-foreground mb-4" />
					<h2 className="text-xl font-semibold mb-2">No expenses found</h2>
					<p className="text-muted-foreground">
						No invoice data matches the selected filters for {year}.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="flex items-center gap-4">
					<YearPicker value={year} onChange={setYear} />
					<Select onValueChange={handleBranchChange}>
						<SelectTrigger className="w-48">
							<SelectValue placeholder="All branches" />
						</SelectTrigger>
						<SelectContent>
							{branchesLoading ? (
								<SelectItem value="loading">Loading branches...</SelectItem>
							) : (
								<>
									<SelectItem value="all">All branches</SelectItem>
									{branches?.map((branch) => (
										<SelectItem key={branch.id} value={branch.id.toString()}>
											{branch.name}
										</SelectItem>
									))}
								</>
							)}
						</SelectContent>
					</Select>
					<Select onValueChange={handleSupplierChange}>
						<SelectTrigger className="w-48">
							<SelectValue placeholder="All suppliers" />
						</SelectTrigger>
						<SelectContent>
							{suppliersLoading ? (
								<SelectItem value="loading">Loading suppliers...</SelectItem>
							) : (
								<>
									<SelectItem value="all">All suppliers</SelectItem>
									{suppliers?.map((supplier) => (
										<SelectItem
											key={supplier.id}
											value={supplier.id.toString()}
										>
											{supplier.name}
										</SelectItem>
									))}
								</>
							)}
						</SelectContent>
					</Select>
					<Select onValueChange={handleCostTypeChange}>
						<SelectTrigger className="w-48">
							<SelectValue placeholder="All cost types" />
						</SelectTrigger>
						<SelectContent>
							{costTypesLoading ? (
								<SelectItem value="loading">Loading cost types...</SelectItem>
							) : (
								<>
									<SelectItem value="all">All cost types</SelectItem>
									{costTypes?.map((costType) => (
										<SelectItem
											key={costType.id}
											value={costType.id.toString()}
										>
											{costType.name}
										</SelectItem>
									))}
								</>
							)}
						</SelectContent>
					</Select>
				</div>
				<Button onClick={exportCSV}>
					<DownloadIcon className="h-4 w-4 mr-2" />
					Export CSV
				</Button>
			</div>
			<ExpensePivotTable data={pivotData} />
		</div>
	);
}

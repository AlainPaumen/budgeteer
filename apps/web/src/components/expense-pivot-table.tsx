import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export const monthNames = [
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

export interface PivotData {
	year: number;
	services: Service[];
	grandTotal: number[];
	grandTotalSum: number;
}

export interface Service {
	serviceId: number;
	serviceName: string;
	categories: Category[];
	total: number;
}

interface Category {
	categoryId: number;
	categoryName: string;
	months: number[];
	total: number;
}

interface ExpensePivotTableProps {
	data: PivotData;
}

export function ExpensePivotTable({ data }: ExpensePivotTableProps) {
	const [collapsedServices, setCollapsedServices] = useState<string[]>(() => {
		const saved = localStorage.getItem("expense-pivot-collapsed");
		return saved ? JSON.parse(saved) : [];
	});

	const toggleService = (serviceId: string) => {
		const newCollapsed = collapsedServices.includes(serviceId)
			? collapsedServices.filter((id) => id !== serviceId)
			: [...collapsedServices, serviceId];
		setCollapsedServices(newCollapsed);
		localStorage.setItem(
			"expense-pivot-collapsed",
			JSON.stringify(newCollapsed),
		);
	};

	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-1/3">Service / Category</TableHead>
						<TableHead className="text-right w-24">Total</TableHead>
						{monthNames.map((month) => (
							<TableHead key={month} className="text-center w-12">
								{month}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow className="bg-muted/30 font-bold">
						<TableCell colSpan={1} className="text-center font-bold">
							Grand Total
						</TableCell>
						<TableCell className="text-right">
							{formatCurrency(data.grandTotalSum)}
						</TableCell>
						{data.grandTotal.map((amount, i) => (
							<TableCell key={monthNames[i]} className="text-center">
								{amount > 0 ? formatCurrency(amount) : "–"}
							</TableCell>
						))}
					</TableRow>
					{data.services.map((service) => (
						<React.Fragment key={service.serviceId}>
							<TableRow
								className="cursor-pointer hover:bg-muted/50"
								onClick={() => toggleService(service.serviceId.toString())}
							>
								<TableCell className="font-bold bg-muted/40">
									{collapsedServices.includes(service.serviceId.toString()) ? (
										<ChevronRightIcon className="inline h-4 w-4 mr-2" />
									) : (
										<ChevronDownIcon className="inline h-4 w-4 mr-2" />
									)}
									{service.serviceName}
								</TableCell>
								<TableCell className="text-right font-bold bg-muted/40">
									{formatCurrency(service.total)}
								</TableCell>
								{service.categories.length === 0 ? (
									<>
										<TableCell colSpan={12} className="text-center">
											–
										</TableCell>
									</>
								) : (
									<>
										{service.categories[0].months.map((amount, i) => (
											<TableCell key={monthNames[i]} className="text-center">
												{amount > 0 ? formatCurrency(amount) : "–"}
											</TableCell>
										))}
									</>
								)}
							</TableRow>
							{!collapsedServices.includes(service.serviceId.toString()) &&
								service.categories.map((category) => (
									<TableRow key={category.categoryId} className="pl-4">
										<TableCell className="pl-8">
											{category.categoryName}
										</TableCell>
										<TableCell className="text-right">
											{formatCurrency(category.total)}
										</TableCell>
										{category.months.map((amount, i) => (
											<TableCell key={monthNames[i]} className="text-center">
												{amount > 0 ? formatCurrency(amount) : "–"}
											</TableCell>
										))}
									</TableRow>
								))}
						</React.Fragment>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

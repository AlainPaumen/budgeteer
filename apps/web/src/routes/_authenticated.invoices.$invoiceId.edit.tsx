import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { InvoiceForm } from "@/components/invoice-form";
import { eden } from "@/lib/api";

export const Route = createFileRoute(
	"/_authenticated/invoices/$invoiceId/edit",
)({
	component: InvoiceEditPage,
});

interface InvoiceLine {
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
	locationId: number | null;
	createdBy: string;
	createdAt: number;
	updatedBy: string;
	updatedAt: number;
}

interface Invoice {
	id: number;
	supplierId: number;
	branchId: number;
	invoiceDate: number;
	invoiceNumber: string;
	createdBy: string;
	createdAt: number;
	updatedBy: string;
	updatedAt: number;
	lines: InvoiceLine[];
}

function InvoiceEditPage() {
	const { invoiceId } = Route.useParams();

	const { data: invoice, isLoading } = useQuery({
		queryKey: ["invoices", invoiceId],
		queryFn: async () => {
			const res = await eden.api.invoices({ id: Number(invoiceId) }).get();
			if (res.error) throw res.error;
			return res.data as unknown as Invoice;
		},
	});

	if (isLoading) {
		return (
			<div className="max-w-4xl mx-auto">
				<div className="py-12 text-center text-sm text-muted-foreground">
					Loading invoice...
				</div>
			</div>
		);
	}

	if (!invoice) {
		return (
			<div className="max-w-4xl mx-auto">
				<div className="py-12 text-center text-sm text-muted-foreground">
					Invoice not found.
				</div>
			</div>
		);
	}

	const initialData = {
		supplierId: invoice.supplierId,
		branchId: invoice.branchId,
		invoiceDate: new Date(invoice.invoiceDate).toISOString().split("T")[0],
		invoiceNumber: invoice.invoiceNumber,
		lines: invoice.lines.map((line) => ({
			description: line.description,
			unit_price: line.unitPrice,
			number_of_units: line.numberOfUnits,
			total_amount: line.totalAmount,
			start_date: line.startDate
				? new Date(line.startDate).toISOString().split("T")[0]
				: "",
			end_date: line.endDate
				? new Date(line.endDate).toISOString().split("T")[0]
				: "",
			service_id: line.serviceId,
			category_id: line.categoryId,
			cost_type_id: line.costTypeId,
			location_id: line.locationId,
		})),
	};

	return (
		<div className="max-w-4xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">Edit Invoice</h1>
			<InvoiceForm invoiceId={Number(invoiceId)} initialData={initialData} />
		</div>
	);
}

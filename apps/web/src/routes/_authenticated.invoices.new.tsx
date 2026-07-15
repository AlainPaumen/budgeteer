import { createFileRoute } from "@tanstack/react-router";
import { InvoiceForm } from "@/components/invoice-form";

export const Route = createFileRoute("/_authenticated/invoices/new")({
	component: InvoiceNewPage,
});

function InvoiceNewPage() {
	return (
		<div className="max-w-4xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">Create Invoice</h1>
			<InvoiceForm />
		</div>
	);
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const DATE_FORMAT = import.meta.env.VITE_DATE_FORMAT || "YYYY-MM-DD";

function padZero(num: number): string {
	return num.toString().padStart(2, "0");
}

export function formatDateFromDate(date: Date): string {
	const year = date.getFullYear();
	const month = padZero(date.getMonth() + 1);
	const day = padZero(date.getDate());

	return DATE_FORMAT.replace("YYYY", String(year))
		.replace("MM", month)
		.replace("DD", day);
}

export function formatDate(timestamp: number): string {
	return formatDateFromDate(new Date(timestamp));
}

export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-EU", {
		style: "currency",
		currency: "EUR",
	}).format(amount);
}

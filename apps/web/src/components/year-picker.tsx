import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface YearPickerProps {
	value: number;
	onChange: (year: number) => void;
}

export function YearPicker({ value, onChange }: YearPickerProps) {
	const prevYear = () => onChange(value - 1);
	const nextYear = () => onChange(value + 1);

	return (
		<div className="flex items-center gap-2">
			<Button variant="outline" size="icon" onClick={prevYear}>
				<ChevronLeftIcon className="h-4 w-4" />
			</Button>
			<span className="font-medium">{value}</span>
			<Button variant="outline" size="icon" onClick={nextYear}>
				<ChevronRightIcon className="h-4 w-4" />
			</Button>
		</div>
	);
}

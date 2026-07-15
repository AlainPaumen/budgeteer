import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatDateFromDate } from "@/lib/utils";

interface DatePickerProps {
	value: string;
	onChange: (date: string) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
}

function parseDate(dateString: string): Date | undefined {
	if (!dateString) return undefined;
	const [year, month, day] = dateString.split("-").map(Number);
	return new Date(year, month - 1, day);
}

function toDateString(date: Date): string {
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function DatePicker({
	value,
	onChange,
	placeholder = "Pick a date",
	className,
	disabled,
}: DatePickerProps) {
	const date = parseDate(value);

	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button
						variant="outline"
						className={cn(
							"w-full justify-start text-left font-normal",
							!date && "text-muted-foreground",
							className,
						)}
						disabled={disabled}
					/>
				}
			>
				<CalendarIcon className="mr-2 size-4" />
				{date ? formatDateFromDate(date) : placeholder}
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={date}
					onSelect={(selectedDate) => {
						if (selectedDate) {
							onChange(toDateString(selectedDate));
						}
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}

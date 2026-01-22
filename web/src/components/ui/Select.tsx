import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	error?: string;
	helperText?: string;
}

let Select = React.forwardRef<HTMLSelectElement, SelectProps>(
	({ className, label, error, helperText, id, children, ...props }, ref) => {
		let selectId = id || React.useId();

		return (
			<div className="w-full">
				{label && (
					<label htmlFor={selectId} className="mb-2 block text-sm font-medium text-slate-700">
						{label}
						{props.required && <span className="ml-1 text-red-500">*</span>}
					</label>
				)}
				<select
					id={selectId}
					className={cn(
						"flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
						error && "border-red-500 focus:border-red-500 focus:ring-red-500",
						className
					)}
					ref={ref}
					aria-invalid={error ? "true" : "false"}
					aria-describedby={
						error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
					}
					{...props}
				>
					{children}
				</select>
				{error && (
					<p id={`${selectId}-error`} className="mt-1 text-sm text-red-600">
						{error}
					</p>
				)}
				{!error && helperText && (
					<p id={`${selectId}-helper`} className="mt-1 text-sm text-slate-500">
						{helperText}
					</p>
				)}
			</div>
		);
	}
);

Select.displayName = "Select";

export { Select };

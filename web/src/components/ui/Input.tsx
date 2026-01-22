import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
}

let Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type = "text", label, error, helperText, id, ...props }, ref) => {
		let inputId = id || React.useId();

		return (
			<div className="w-full">
				{label && (
					<label
						htmlFor={inputId}
						className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300"
					>
						{label}
						{props.required && <span className="ml-1 text-red-500">*</span>}
					</label>
				)}
				<input
					id={inputId}
					type={type}
					className={cn(
						"flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-sky-400 dark:focus:ring-sky-400",
						error && "border-red-500 focus:border-red-500 focus:ring-red-500",
						className
					)}
					ref={ref}
					aria-invalid={error ? "true" : "false"}
					aria-describedby={
						error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
					}
					{...props}
				/>
				{error && (
					<p id={`${inputId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
						{error}
					</p>
				)}
				{!error && helperText && (
					<p id={`${inputId}-helper`} className="mt-1 text-sm text-slate-500 dark:text-gray-400">
						{helperText}
					</p>
				)}
			</div>
		);
	}
);

Input.displayName = "Input";

export { Input };

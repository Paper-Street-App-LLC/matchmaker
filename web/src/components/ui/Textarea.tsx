import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	error?: string;
	helperText?: string;
}

let Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, label, error, helperText, id, ...props }, ref) => {
		let textareaId = id || React.useId();

		return (
			<div className="w-full">
				{label && (
					<label htmlFor={textareaId} className="mb-2 block text-sm font-medium text-slate-700">
						{label}
						{props.required && <span className="ml-1 text-red-500">*</span>}
					</label>
				)}
				<textarea
					id={textareaId}
					className={cn(
						"flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
						error && "border-red-500 focus:border-red-500 focus:ring-red-500",
						className
					)}
					ref={ref}
					aria-invalid={error ? "true" : "false"}
					aria-describedby={
						error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
					}
					{...props}
				/>
				{error && (
					<p id={`${textareaId}-error`} className="mt-1 text-sm text-red-600">
						{error}
					</p>
				)}
				{!error && helperText && (
					<p id={`${textareaId}-helper`} className="mt-1 text-sm text-slate-500">
						{helperText}
					</p>
				)}
			</div>
		);
	}
);

Textarea.displayName = "Textarea";

export { Textarea };

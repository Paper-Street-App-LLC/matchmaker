import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "outline";
	size?: "sm" | "md" | "lg";
	isLoading?: boolean;
}

let Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant = "primary",
			size = "md",
			isLoading = false,
			disabled,
			children,
			...props
		},
		ref
	) => {
		let baseStyles =
			"inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

		let variantStyles = {
			primary: "bg-sky-500 text-white hover:bg-sky-600 focus-visible:ring-sky-500",
			secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-500",
			outline:
				"border border-slate-300 bg-transparent hover:bg-slate-100 focus-visible:ring-slate-500",
		};

		let sizeStyles = {
			sm: "h-9 px-3 text-sm",
			md: "h-10 px-4 py-2",
			lg: "h-11 px-8 text-lg",
		};

		return (
			<button
				ref={ref}
				className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
				disabled={disabled || isLoading}
				{...props}
			>
				{isLoading ? (
					<>
						<svg
							className="mr-2 h-4 w-4 animate-spin"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							></circle>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						{children}
					</>
				) : (
					children
				)}
			</button>
		);
	}
);

Button.displayName = "Button";

export { Button };

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: "default" | "bordered" | "elevated";
}

let Card = React.forwardRef<HTMLDivElement, CardProps>(
	({ className, variant = "default", ...props }, ref) => {
		let variantStyles = {
			default: "bg-white dark:bg-gray-800",
			bordered: "border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800",
			elevated: "bg-white dark:bg-gray-800 shadow-md",
		};

		return (
			<div
				ref={ref}
				className={cn("rounded-lg p-6", variantStyles[variant], className)}
				{...props}
			/>
		);
	}
);

Card.displayName = "Card";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

let CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
	({ className, ...props }, ref) => {
		return <div ref={ref} className={cn("mb-4 flex flex-col space-y-1.5", className)} {...props} />;
	}
);

CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
	as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

let CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
	({ className, as: Component = "h3", ...props }, ref) => {
		return (
			<Component
				ref={ref}
				className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
				{...props}
			/>
		);
	}
);

CardTitle.displayName = "CardTitle";

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

let CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
	({ className, ...props }, ref) => {
		return (
			<p
				ref={ref}
				className={cn("text-sm text-slate-500 dark:text-slate-400", className)}
				{...props}
			/>
		);
	}
);

CardDescription.displayName = "CardDescription";

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

let CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
	({ className, ...props }, ref) => {
		return <div ref={ref} className={cn("", className)} {...props} />;
	}
);

CardContent.displayName = "CardContent";

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

let CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
	({ className, ...props }, ref) => {
		return <div ref={ref} className={cn("mt-4 flex items-center", className)} {...props} />;
	}
);

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

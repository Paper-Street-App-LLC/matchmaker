import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Philosophy } from "./Philosophy";

describe("Philosophy", () => {
	it("renders the section headline", () => {
		render(<Philosophy />);
		expect(
			screen.getByRole("heading", { name: /technology that stays in the background/i }),
		).toBeInTheDocument();
	});

	it("renders the first body paragraph", () => {
		render(<Philosophy />);
		expect(
			screen.getByText(
				/the best introduction you've ever gotten probably came from a friend who just knew/i,
			),
		).toBeInTheDocument();
	});

	it("renders the AI card with title and description", () => {
		render(<Philosophy />);
		expect(
			screen.getByText(/ai does the analysis/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/remembers the details, spots the patterns/i),
		).toBeInTheDocument();
	});

	it("renders the matchmaker card with title and description", () => {
		render(<Philosophy />);
		expect(
			screen.getByText(/you make the call/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/the matchmaker makes the introduction/i),
		).toBeInTheDocument();
	});
});

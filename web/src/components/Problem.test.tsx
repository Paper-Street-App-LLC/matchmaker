import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Problem } from "./Problem";

describe("Problem", () => {
	it("renders the section headline", () => {
		render(<Problem />);
		expect(
			screen.getByRole("heading", { name: /finding your person shouldn't feel like this/i }),
		).toBeInTheDocument();
	});

	it("renders the subheadline", () => {
		render(<Problem />);
		expect(
			screen.getByText(
				/more options than ever, but finding the right match hasn't gotten easier/i,
			),
		).toBeInTheDocument();
	});

	it("renders all three problem cards", () => {
		render(<Problem />);
		expect(screen.getByText("Built to keep you scrolling")).toBeInTheDocument();
		expect(screen.getByText("Profiles aren't people")).toBeInTheDocument();
		expect(screen.getByText("Good matches take good judgment")).toBeInTheDocument();
	});

	it("renders card descriptions", () => {
		render(<Problem />);
		expect(
			screen.getByText(
				/most apps are designed around engagement, not outcomes/i,
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				/a photo and a few lines of text can't tell you/i,
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				/the best introductions come from people who know both sides/i,
			),
		).toBeInTheDocument();
	});
});

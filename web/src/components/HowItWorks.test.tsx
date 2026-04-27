import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HowItWorks } from "./HowItWorks";

describe("HowItWorks", () => {
	it("renders the section headline", () => {
		render(<HowItWorks />);
		expect(
			screen.getByRole("heading", { name: /how matchmaker works/i }),
		).toBeInTheDocument();
	});

	it("renders the intro paragraph explaining who matchmaker is", () => {
		render(<HowItWorks />);
		expect(
			screen.getByText(
				/your matchmaker is someone who already knows you/i,
			),
		).toBeInTheDocument();
	});

	it("renders the singles column heading", () => {
		render(<HowItWorks />);
		expect(screen.getByText("For singles")).toBeInTheDocument();
	});

	it("renders the matchmakers column heading", () => {
		render(<HowItWorks />);
		expect(screen.getByText("For matchmakers")).toBeInTheDocument();
	});

	it("renders all singles steps with new content", () => {
		render(<HowItWorks />);
		expect(screen.getByText("Choose your matchmaker")).toBeInTheDocument();
		expect(screen.getByText("You both get interviewed")).toBeInTheDocument();
		expect(screen.getByText("Meet with context")).toBeInTheDocument();
	});

	it("renders all matchmaker steps with new content", () => {
		render(<HowItWorks />);
		expect(screen.getByText("Get asked to help")).toBeInTheDocument();
		expect(screen.getByText("Answer the real questions")).toBeInTheDocument();
		expect(screen.getByText("Make the introduction")).toBeInTheDocument();
	});

	it("renders singles step descriptions", () => {
		render(<HowItWorks />);
		expect(
			screen.getByText(/pick a friend or family member who knows you well/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/you share what you're looking for/i),
		).toBeInTheDocument();
	});

	it("renders matchmaker step descriptions", () => {
		render(<HowItWorks />);
		expect(
			screen.getByText(/a friend wants you to advocate for them/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/why are they single/i),
		).toBeInTheDocument();
	});
});

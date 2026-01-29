import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HowItWorks } from "./HowItWorks";

describe("HowItWorks", () => {
	it("renders the section headline", () => {
		render(<HowItWorks />);
		expect(
			screen.getByRole("heading", { name: /how matchlight works/i }),
		).toBeInTheDocument();
	});

	it("renders the subheadline", () => {
		render(<HowItWorks />);
		expect(
			screen.getByText(
				/whether you're ready to be matched or you're the one making the matches/i,
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

	it("renders all singles steps", () => {
		render(<HowItWorks />);
		expect(screen.getByText("Tell us about yourself")).toBeInTheDocument();
		expect(screen.getByText("Get matched by a person")).toBeInTheDocument();
		expect(screen.getByText("Meet with purpose")).toBeInTheDocument();
	});

	it("renders all matchmaker steps", () => {
		render(<HowItWorks />);
		expect(screen.getByText("Keep notes on everyone")).toBeInTheDocument();
		expect(screen.getByText("Let AI find what you'd miss")).toBeInTheDocument();
		expect(screen.getByText("Track what works")).toBeInTheDocument();
	});

	it("renders step descriptions", () => {
		render(<HowItWorks />);
		expect(
			screen.getByText(/share what matters to you/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/matchlight reads your notes and surfaces compatibility/i),
		).toBeInTheDocument();
	});
});

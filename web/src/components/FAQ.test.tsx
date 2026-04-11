import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FAQ } from "./FAQ";

describe("FAQ", () => {
	it("renders the section headline", () => {
		render(<FAQ />);
		expect(
			screen.getByRole("heading", { name: /frequently asked questions/i }),
		).toBeInTheDocument();
	});

	it("renders the 'Who is my matchmaker?' FAQ", () => {
		render(<FAQ />);
		expect(screen.getByText("Who is my matchmaker?")).toBeInTheDocument();
	});

	it("renders the 'Why do both people get interviewed?' FAQ", () => {
		render(<FAQ />);
		expect(
			screen.getByText("Why do both people get interviewed?"),
		).toBeInTheDocument();
	});

	it("renders the 'What kind of questions do you ask?' FAQ", () => {
		render(<FAQ />);
		expect(
			screen.getByText("What kind of questions do you ask?"),
		).toBeInTheDocument();
	});

	it("renders existing FAQs", () => {
		render(<FAQ />);
		expect(screen.getByText("What is Matchmaker?")).toBeInTheDocument();
		expect(
			screen.getByText("How is this different from apps?"),
		).toBeInTheDocument();
		expect(screen.getByText("What does the AI do?")).toBeInTheDocument();
	});
});

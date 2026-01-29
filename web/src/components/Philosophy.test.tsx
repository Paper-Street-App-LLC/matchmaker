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

	it("renders the second body paragraph", () => {
		render(<Philosophy />);
		expect(
			screen.getByText(
				/matchlight gives matchmakers the tools to do that at scale/i,
			),
		).toBeInTheDocument();
	});
});

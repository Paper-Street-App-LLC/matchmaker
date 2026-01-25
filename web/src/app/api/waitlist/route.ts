import { NextRequest, NextResponse } from "next/server";
import { waitlistSchema } from "@/schemas/waitlist";
import { createSupabaseClient } from "@/lib/supabase";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
	try {
		// Parse request body
		let body = await request.json();

		// Validate with Zod schema
		let validatedData = waitlistSchema.parse(body);

		// Create Supabase client
		let supabase = createSupabaseClient();

		// Insert into waitlist_matchmakers table
		let { error } = await supabase.from("waitlist_matchmakers").insert({
			email: validatedData.email,
			name: validatedData.name,
			organization: validatedData.organization || null,
			phone: validatedData.phone || null,
			how_heard: validatedData.how_heard || null,
			message: validatedData.message || null,
			status: "pending",
		});

		if (error) {
			// Handle duplicate email constraint
			if (error.code === "23505") {
				return NextResponse.json(
					{
						error: "This email is already on the waitlist",
					},
					{ status: 409 }
				);
			}

			// Log server error for debugging
			console.error("Supabase error:", error);
			return NextResponse.json(
				{
					error: "Failed to join waitlist. Please try again.",
				},
				{ status: 500 }
			);
		}

		// Success response
		return NextResponse.json(
			{
				message: "Successfully joined the waitlist!",
			},
			{ status: 201 }
		);
	} catch (error) {
		// Handle Zod validation errors
		if (error instanceof ZodError) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: error.errors,
				},
				{ status: 400 }
			);
		}

		// Handle JSON parse errors
		if (error instanceof SyntaxError) {
			return NextResponse.json(
				{
					error: "Invalid JSON in request body",
				},
				{ status: 400 }
			);
		}

		// Generic server error
		console.error("Unexpected error:", error);
		return NextResponse.json(
			{
				error: "An unexpected error occurred. Please try again.",
			},
			{ status: 500 }
		);
	}
}

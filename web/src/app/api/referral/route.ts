import { NextResponse } from "next/server";
import { referralSchema } from "@/schemas/referral";
import { createSupabaseClient } from "@/lib/supabase";

export async function POST(request: Request) {
	try {
		// Parse request body
		let body = await request.json();

		// Validate with Zod schema
		let validationResult = referralSchema.safeParse(body);
		if (!validationResult.success) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: validationResult.error.errors,
				},
				{ status: 400 }
			);
		}

		let data = validationResult.data;

		// Create Supabase client
		let supabase = createSupabaseClient();

		// Insert into waitlist_referrals table
		let { data: insertedData, error } = await supabase
			.from("waitlist_referrals")
			.insert({
				single_name: data.single_name,
				single_email: data.single_email,
				matchmaker_name: data.matchmaker_name || null,
				matchmaker_email: data.matchmaker_email,
				message: data.message || null,
				status: "pending",
			})
			.select()
			.single();

		// Handle duplicate constraint violation (unique on single_email + matchmaker_email)
		if (error) {
			if (error.code === "23505") {
				// PostgreSQL unique violation code
				return NextResponse.json(
					{
						error: "You have already referred this matchmaker. Thank you for your enthusiasm!",
					},
					{ status: 409 }
				);
			}

			// Log unexpected errors
			console.error("Supabase error:", error);
			return NextResponse.json(
				{ error: "Failed to submit referral. Please try again later." },
				{ status: 500 }
			);
		}

		// Success
		return NextResponse.json(
			{
				message: "Referral submitted successfully!",
				data: insertedData,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Unexpected error in /api/referral:", error);
		return NextResponse.json(
			{ error: "An unexpected error occurred. Please try again later." },
			{ status: 500 }
		);
	}
}

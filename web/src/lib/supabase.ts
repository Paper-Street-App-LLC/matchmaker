import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient() {
	let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!url || !anonKey) {
		throw new Error("Missing Supabase environment variables. Please check .env.local file.");
	}

	return createClient(url, anonKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
		},
	});
}

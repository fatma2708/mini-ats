import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill it.");
}

// Only the public anon key lives in the browser. Every query runs with the
// logged-in user's JWT, so Row Level Security decides what can be read/written.
export const supabase = createClient<Database>(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const CV_BUCKET = "cvs";

import { createClient } from "@supabase/supabase-js";

/* ─────────────────────────────────────────────────────────────────────────
   One Supabase client for the whole app. Everything that talks to the
   database or auth should import `supabase` from here — never create a
   second client elsewhere, or auth state can get out of sync between them.

   Reads from Vite's env vars (import.meta.env), which come from:
   - .env (local dev, git-ignored, real values)
   - Vercel project settings (production, set there directly)
───────────────────────────────────────────────────────────────────────── */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly and immediately rather than letting every query fail
  // silently later with a confusing network error.
  throw new Error(
    "Missing Supabase env vars. Copy .env.example to .env and fill in " +
    "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase " +
    "project's Settings → API page."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

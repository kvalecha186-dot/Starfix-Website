import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    "Starfix Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the environment."
  );
}

export const supabase = createClient(
  supabaseUrl ?? "https://mndyaxvkjzzgyvfrxgvm.supabase.co",
  supabasePublishableKey ?? ""
);

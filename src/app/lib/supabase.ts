import { createClient } from "@supabase/supabase-js";

// Supabase publishable keys are designed for browser applications.
// RLS is enabled on the Starfix database, so this key must never be confused
// with a service-role/secret key.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "https://mndyaxvkjzzgyvfrxgvm.supabase.co";
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_oSRryTseVP0tCs0kSTeWCQ_wG1ydebQ";

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

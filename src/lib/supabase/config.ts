import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/credentials";

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    supabasePublishableKey;

  return url && publishableKey ? { url, publishableKey } : null;
}

export function hasSupabaseConfig() {
  return getSupabaseConfig() !== null;
}

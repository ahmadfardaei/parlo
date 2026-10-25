import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Null when the app is built without Supabase settings: it then runs in device-only mode.
export const supabase = url && key
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" } })
  : null;

// Where Supabase should send people back to after Google sign-in or an email link.
export const appUrl = () => location.origin + location.pathname;

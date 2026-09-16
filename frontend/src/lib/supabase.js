import { createClient } from "@supabase/supabase-js";
import { createMockSupabase } from "./mockSupabase";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const isConfigured = Boolean(
  url &&
  key &&
  !url.includes("YOUR_PROJECT_REF") &&
  !key.includes("xxx")
);

export const supabase = isConfigured
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : createMockSupabase();


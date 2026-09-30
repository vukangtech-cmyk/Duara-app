import { createClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

const url = rawUrl?.trim();
const key = rawKey?.trim();

const isConfigured = Boolean(
  url &&
  key &&
  url.startsWith("https://") &&
  !url.includes("YOUR_PROJECT_REF") &&
  !key.includes("xxx")
);

export const supabase = isConfigured
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

export const supabaseConfigured = isConfigured;

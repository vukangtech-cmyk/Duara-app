import { createClient } from "@supabase/supabase-js";

const env =
  typeof import.meta !== "undefined" && import.meta?.env
    ? import.meta.env
    : typeof process !== "undefined" && process?.env
    ? process.env
    : {};

const rawUrl = env.VITE_SUPABASE_URL;
const rawKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

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

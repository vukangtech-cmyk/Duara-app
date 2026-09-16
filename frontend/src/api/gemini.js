import { supabase } from "../lib/supabase";

export async function askGemini({ prompt, messages, systemInstruction, temperature, maxOutputTokens, signal } = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Sign in is required to use Gemini");
  }

  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ prompt, messages, systemInstruction, temperature, maxOutputTokens }),
    signal,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Gemini request failed");
  }
  return data.text;
}

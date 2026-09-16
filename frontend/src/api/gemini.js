export async function askGemini({ prompt, messages, systemInstruction, temperature, maxOutputTokens, signal } = {}) {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, messages, systemInstruction, temperature, maxOutputTokens }),
    signal,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Gemini request failed");
  }
  return data.text;
}

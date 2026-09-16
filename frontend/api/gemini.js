const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_PROMPT_LENGTH = 12000;
const MAX_MESSAGES = 30;

function sendJson(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json").json(body);
}

function extractText(data) {
  return (data?.candidates ?? [])
    .flatMap((candidate) => candidate?.content?.parts ?? [])
    .map((part) => part?.text ?? "")
    .join("")
    .trim();
}

function normalizeContents(body) {
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    return body.messages.slice(-MAX_MESSAGES).map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: String(message.content ?? "").slice(0, MAX_PROMPT_LENGTH) }],
    }));
  }

  return [{
    role: "user",
    parts: [{ text: String(body.prompt ?? "").slice(0, MAX_PROMPT_LENGTH) }],
  }];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return sendJson(res, 503, { error: "Gemini API is not configured on the server" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
  const contents = normalizeContents(body);
  const hasText = contents.some((content) => content.parts.some((part) => part.text.trim()));
  if (!hasText) {
    return sendJson(res, 400, { error: "prompt or messages is required" });
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const payload = {
    contents,
    generationConfig: {
      temperature: typeof body.temperature === "number" ? Math.min(Math.max(body.temperature, 0), 2) : 0.7,
      maxOutputTokens: typeof body.maxOutputTokens === "number" ? Math.min(Math.max(body.maxOutputTokens, 1), 2048) : 1024,
    },
  };

  if (typeof body.systemInstruction === "string" && body.systemInstruction.trim()) {
    payload.systemInstruction = { parts: [{ text: body.systemInstruction.slice(0, MAX_PROMPT_LENGTH) }] };
  }

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });
    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      console.error("Gemini API error", upstream.status, data?.error?.status || data?.error?.message);
      return sendJson(res, upstream.status === 429 ? 429 : 502, {
        error: "Gemini request failed",
        code: data?.error?.status || "UPSTREAM_ERROR",
      });
    }

    const text = extractText(data);
    if (!text) {
      return sendJson(res, 502, { error: "Gemini returned no text" });
    }

    return sendJson(res, 200, {
      text,
      model,
      usage: data.usageMetadata ?? null,
    });
  } catch (error) {
    console.error("Gemini proxy error", error);
    return sendJson(res, 502, { error: "Unable to reach Gemini API" });
  }
}

const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_PROMPT_LENGTH = 12000;
const MAX_MESSAGES = 30;

function sendJson(res, status, body) {
  res
    .status(status)
    .setHeader("Content-Type", "application/json")
    .setHeader("Cache-Control", "no-store")
    .setHeader("X-Content-Type-Options", "nosniff")
    .setHeader("Referrer-Policy", "no-referrer")
    .json(body);
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

async function requireAuthenticatedUser(req) {
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer ")) return null;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
    headers: { apikey: supabaseKey, Authorization: authorization },
  });
  if (!response.ok) return null;
  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  let user;
  try {
    user = await requireAuthenticatedUser(req);
  } catch (error) {
    console.error("Supabase auth verification failed", error);
    return sendJson(res, 401, { error: "Authentication unavailable" });
  }
  if (!user) return sendJson(res, 401, { error: "Sign in is required" });

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return sendJson(res, 503, { error: "Gemini API is not configured on the server" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
  } catch {
    return sendJson(res, 400, { error: "Request body must be valid JSON" });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return sendJson(res, 400, { error: "Request body must be an object" });
  }
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

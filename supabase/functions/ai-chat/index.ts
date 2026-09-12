// Veya AI Coach / AI Food Assistant Edge Function
// Deploy with: supabase functions deploy ai-chat
// Set the server secret with: supabase secrets set ANTHROPIC_API_KEY=...

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Missing authorization" }, 401);

    if (!ANTHROPIC_API_KEY) return json({ error: "AI service is not configured." }, 500);
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return json({ error: "Supabase function environment is not configured." }, 500);

    // Verify that the bearer token is a real Supabase user session.
    // Checking only for the presence of an Authorization header is not sufficient.
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader,
      },
    });

    if (!userRes.ok) return json({ error: "Invalid or expired session" }, 401);

    const user = await userRes.json();
    if (!user?.id) return json({ error: "Invalid user session" }, 401);

    const body = await req.json();
    const { system, messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: "messages must be a non-empty array" }, 400);
    }

    // Keep accidental/unbounded payloads from being sent to the model.
    if (messages.length > 30) return json({ error: "Too many messages" }, 400);
    if (JSON.stringify(messages).length > 120000) return json({ error: "Request is too large" }, 413);
    if (typeof system === "string" && system.length > 20000) return json({ error: "System prompt is too large" }, 400);

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1000,
        ...(typeof system === "string" && system.trim() ? { system } : {}),
        messages,
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return json({ error: data?.error?.message || "AI request failed" }, anthropicRes.status);
    }

    return json(data);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected server error" }, 500);
  }
});

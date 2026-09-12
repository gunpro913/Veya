// supabase/functions/ai-chat/index.ts
//
// Deploy with:  supabase functions deploy ai-chat
// Set the secret with: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// This is the only place the Anthropic API key should ever live. The
// frontend never sees it — it only calls this function with a Supabase
// user JWT, and this function attaches the real key server-side.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // tighten to your real domain before production launch
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Require a logged-in Supabase user (any authenticated request) —
    // this is a cheap check via presence of the Authorization header,
    // which Supabase's client automatically attaches for authenticated calls.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: corsHeaders });
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "Server is not configured with an Anthropic API key." }), { status: 500, headers: corsHeaders });
    }

    const { system, messages } = await req.json();

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
        system,
        messages,
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return new Response(JSON.stringify({ error: data?.error?.message || "Anthropic API request failed" }), { status: anthropicRes.status, headers: corsHeaders });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || "Unexpected error" }), { status: 500, headers: corsHeaders });
  }
});

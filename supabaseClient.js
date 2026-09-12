/**
 * Minimal fetch-based Supabase client.
 *
 * Why this exists instead of `@supabase/supabase-js`:
 * the chat-artifact sandbox this app currently runs in only allows a fixed
 * set of pre-approved npm imports, and the Supabase SDK isn't one of them.
 * Supabase's Auth and Database layers are just HTTP APIs underneath
 * (GoTrue + PostgREST), so this talks to them directly with fetch().
 *
 * If/when this app moves into a real project (e.g. via Claude Code), swap
 * this file for the real `@supabase/supabase-js` client — same shape of
 * calls, better DX, realtime support, etc. This file is intentionally kept
 * close to that API surface to make that swap easy later.
 */

const SUPABASE_URL = "REPLACE_WITH_YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "REPLACE_WITH_YOUR_ANON_PUBLIC_KEY";

const isConfigured = () =>
  SUPABASE_URL !== "REPLACE_WITH_YOUR_SUPABASE_URL" &&
  SUPABASE_ANON_KEY !== "REPLACE_WITH_YOUR_ANON_PUBLIC_KEY";

let currentSession = null; // { access_token, refresh_token, user }
const SESSION_KEY = "supabase-session"; // stored via window.storage, personal/private

async function loadSession() {
  try {
    const res = await window.storage.get(SESSION_KEY, false);
    if (res && res.value) currentSession = JSON.parse(res.value);
  } catch (e) { /* no session yet */ }
  return currentSession;
}
async function saveSession(session) {
  currentSession = session;
  try {
    if (session) await window.storage.set(SESSION_KEY, JSON.stringify(session), false);
    else await window.storage.delete(SESSION_KEY, false);
  } catch (e) { /* ignore */ }
}

function authHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${currentSession?.access_token || SUPABASE_ANON_KEY}`,
  };
}

/* ---------------------------- AUTH ---------------------------- */

async function signUp(email, password, displayName) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password, data: { display_name: displayName || "" } }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Sign up failed");
  if (data.access_token) await saveSession(data);
  return data;
}

async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Sign in failed");
  await saveSession(data);
  return data;
}

async function signOut() {
  if (currentSession?.access_token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: authHeaders(),
    }).catch(() => {});
  }
  await saveSession(null);
}

async function resetPasswordForEmail(email, redirectTo) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, ...(redirectTo ? { gotrue_meta_security: {}, redirect_to: redirectTo } : {}) }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error_description || data.msg || "Could not send reset email");
  }
}

async function getSession() {
  if (!currentSession) await loadSession();
  return currentSession;
}

/* ---------------------------- REST (PostgREST) ---------------------------- */
/**
 * Thin wrapper around PostgREST. RLS policies (set up via the SQL migrations)
 * are what actually enforce that a user can only read/write their own rows —
 * this client does not add extra client-side filtering for security, only
 * for convenience.
 */

async function restRequest(table, { method = "GET", query = "", body, prefer } = {}) {
  if (!isConfigured()) {
    throw new Error("Supabase isn't configured yet — set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  const session = await getSession();
  const headers = {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
  };
  if (prefer) headers.Prefer = prefer;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request to ${table} failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const db = {
  select: (table, query = "?select=*") => restRequest(table, { method: "GET", query }),
  insert: (table, row) => restRequest(table, { method: "POST", body: row, prefer: "return=representation" }),
  update: (table, query, patch) => restRequest(table, { method: "PATCH", query, body: patch, prefer: "return=representation" }),
  delete: (table, query) => restRequest(table, { method: "DELETE", query }),
};

export const supabase = {
  isConfigured,
  auth: { signUp, signIn, signOut, getSession, resetPasswordForEmail },
  db,
};

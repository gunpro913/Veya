/* Veya runtime hardening.
 *
 * This stays outside App.jsx so the large UI file does not need a risky
 * whole-file rewrite. It provides two browser-level protections:
 * 1. transparently refreshes expired Supabase access tokens and retries 401s;
 * 2. namespaces the legacy local app-state key by authenticated user id.
 *
 * This is defense-in-depth only. Database RLS/RPCs remain the real security
 * boundary for XP, purchases, roles, and other sensitive operations.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SESSION_KEY = "supabase-session";
const LEGACY_STATE_KEY = "fitness-app-local-v1";
const ORIGINAL_FETCH = window.fetch.bind(window);
const ORIGINAL_GET = Storage.prototype.getItem;
const ORIGINAL_SET = Storage.prototype.setItem;
const ORIGINAL_REMOVE = Storage.prototype.removeItem;

function readSession() {
  try {
    const raw = ORIGINAL_GET.call(localStorage, SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function userStorageKey(key) {
  if (key !== LEGACY_STATE_KEY) return key;
  const session = readSession();
  const userId = session?.user?.id;
  return userId ? `${LEGACY_STATE_KEY}:${userId}` : `${LEGACY_STATE_KEY}:guest`;
}

/* Keep the session itself global, but isolate the app's legacy state. */
Storage.prototype.getItem = function(key) {
  return ORIGINAL_GET.call(this, userStorageKey(key));
};
Storage.prototype.setItem = function(key, value) {
  return ORIGINAL_SET.call(this, userStorageKey(key), value);
};
Storage.prototype.removeItem = function(key) {
  return ORIGINAL_REMOVE.call(this, userStorageKey(key));
};

let refreshPromise = null;

async function refreshSession() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const session = readSession();
  if (!session?.refresh_token) return null;

  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const response = await ORIGINAL_FETCH(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });
      if (!response.ok) {
        ORIGINAL_REMOVE.call(localStorage, SESSION_KEY);
        return null;
      }
      const next = await response.json();
      const merged = { ...session, ...next, user: next.user || session.user };
      ORIGINAL_SET.call(localStorage, SESSION_KEY, JSON.stringify(merged));
      return merged;
    } catch (_) {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

window.fetch = async function(input, init = {}) {
  const url = typeof input === "string" ? input : input?.url || "";
  const isSupabaseRequest = SUPABASE_URL && url.startsWith(SUPABASE_URL);
  const response = await ORIGINAL_FETCH(input, init);

  if (!isSupabaseRequest || response.status !== 401 || init.__veyaRetried) {
    return response;
  }

  const refreshed = await refreshSession();
  if (!refreshed?.access_token) return response;

  const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
  headers.set("Authorization", `Bearer ${refreshed.access_token}`);
  headers.set("apikey", SUPABASE_ANON_KEY);

  return ORIGINAL_FETCH(input, { ...init, headers, __veyaRetried: true });
};

/* Remove a pre-hardening unscoped state key after the app has had a chance
 * to load it. It is deliberately not copied into a signed-in user's state. */
try {
  ORIGINAL_REMOVE.call(localStorage, LEGACY_STATE_KEY);
} catch (_) {}

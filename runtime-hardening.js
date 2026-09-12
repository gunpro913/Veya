/* Veya runtime hardening.
 *
 * Keeps risky changes out of the large App.jsx while providing:
 * - Supabase access-token refresh + 401 retry;
 * - per-user isolation for the legacy local-state key;
 * - routing XP ledger writes through the server-side validation RPC;
 * - shared exercise-image sync backed by Supabase with server-side admin RLS.
 *
 * The database remains the security boundary. This file is only a compatibility
 * layer for the existing UI until the data layer is fully modularized.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SESSION_KEY = "supabase-session";
const LEGACY_STATE_KEY = "fitness-app-local-v1";
const SHARED_IMAGES_KEY = "veya-shared-exercise-images";
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
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
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

async function retryWithFreshSession(input, init) {
  const refreshed = await refreshSession();
  if (!refreshed?.access_token) return null;
  const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
  headers.set("Authorization", `Bearer ${refreshed.access_token}`);
  headers.set("apikey", SUPABASE_ANON_KEY);
  return ORIGINAL_FETCH(input, { ...init, headers });
}

function exerciseImageRowsToMap(rows) {
  const map = {};
  for (const row of Array.isArray(rows) ? rows : []) {
    map[row.exercise_id] = {
      ...(row.start_url ? { start: row.start_url } : {}),
      ...(row.end_url ? { end: row.end_url } : {}),
      ...(row.muscle_map_url ? { muscleMap: row.muscle_map_url } : {}),
    };
  }
  return map;
}

function exerciseImageMapToRows(images) {
  return Object.entries(images || {}).map(([exerciseId, value]) => ({
    exercise_id: exerciseId,
    start_url: value?.start || null,
    end_url: value?.end || null,
    muscle_map_url: value?.muscleMap || null,
  }));
}

async function loadSharedExerciseImagesFromSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    const response = await ORIGINAL_FETCH(`${SUPABASE_URL}/rest/v1/exercise_images?select=exercise_id,start_url,end_url,muscle_map_url`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!response.ok) return;
    const rows = await response.json();
    ORIGINAL_SET.call(localStorage, SHARED_IMAGES_KEY, JSON.stringify(exerciseImageRowsToMap(rows)));
  } catch (_) {
    /* Offline: keep the last cached shared-image map. */
  }
}

async function syncSharedExerciseImagesToSupabase(images) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  const rows = exerciseImageMapToRows(images);
  if (!rows.length) return;

  const session = readSession();
  const headers = new Headers({
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=minimal",
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
  });
  const init = { method: "POST", headers, body: JSON.stringify(rows) };
  const endpoint = `${SUPABASE_URL}/rest/v1/exercise_images?on_conflict=exercise_id`;

  try {
    let response = await ORIGINAL_FETCH(endpoint, init);
    if (response.status === 401) response = (await retryWithFreshSession(endpoint, init)) || response;
    if (!response.ok) console.warn("Veya: shared exercise images were not synced; admin authorization may be required.");
  } catch (_) {
    console.warn("Veya: shared exercise images could not be synced while offline.");
  }
}

/* Keep the auth session global, but isolate the app's legacy state.
 * SHARED_IMAGES_KEY intentionally stays global because it mirrors a public
 * Supabase table shared across all users/devices. */
Storage.prototype.getItem = function(key) {
  return ORIGINAL_GET.call(this, userStorageKey(key));
};
Storage.prototype.setItem = function(key, value) {
  const result = ORIGINAL_SET.call(this, userStorageKey(key), value);
  if (this === localStorage && key === SHARED_IMAGES_KEY) {
    try { void syncSharedExerciseImagesToSupabase(JSON.parse(value)); } catch (_) {}
  }
  return result;
};
Storage.prototype.removeItem = function(key) {
  return ORIGINAL_REMOVE.call(this, userStorageKey(key));
};

window.fetch = async function(input, init = {}) {
  const url = typeof input === "string" ? input : input?.url || "";
  const isSupabaseRequest = Boolean(SUPABASE_URL && url.startsWith(SUPABASE_URL));

  /* Existing App.jsx writes xp_transactions directly. Convert those writes
   * to the validated Postgres function without changing the large UI file. */
  if (isSupabaseRequest && url.includes("/rest/v1/xp_transactions") && (init.method || "GET").toUpperCase() === "POST") {
    try {
      const payload = typeof init.body === "string" ? JSON.parse(init.body) : null;
      if (payload?.amount != null && payload?.reason) {
        const session = readSession();
        const headers = new Headers(init.headers || {});
        headers.set("Content-Type", "application/json");
        headers.set("apikey", SUPABASE_ANON_KEY);
        headers.set("Authorization", `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`);
        const rpcInit = { ...init, method: "POST", headers, body: JSON.stringify({ p_amount: payload.amount, p_reason: payload.reason }) };
        let rpcResponse = await ORIGINAL_FETCH(`${SUPABASE_URL}/rest/v1/rpc/veya_apply_xp`, rpcInit);
        if (rpcResponse.status === 401) rpcResponse = (await retryWithFreshSession(`${SUPABASE_URL}/rest/v1/rpc/veya_apply_xp`, rpcInit)) || rpcResponse;
        return rpcResponse;
      }
    } catch (_) {
      /* Fall through to the original request so the app can surface its error. */
    }
  }

  const response = await ORIGINAL_FETCH(input, init);
  if (!isSupabaseRequest || response.status !== 401) return response;

  return (await retryWithFreshSession(input, init)) || response;
};

/* Never migrate an old unscoped state blob into a signed-in account. */
try {
  ORIGINAL_REMOVE.call(localStorage, LEGACY_STATE_KEY);
} catch (_) {}

/* Prime the legacy synchronous cache before App.jsx begins rendering. The UI
 * can keep using its existing localStorage helper, while Supabase is now the
 * shared source of truth. */
await loadSharedExerciseImagesFromSupabase();

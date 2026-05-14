// Saved-canvases storage.
//
// Anonymous users: localStorage only (existing behavior).
// Signed-in users: localStorage + Supabase, with the cloud as the source of
// truth on load. The local copy is a cache that survives page reloads and
// keeps the UI responsive while the network call is in flight.
//
// All mutations write through to localStorage immediately so the editor
// never feels laggy; cloud writes happen in the background and surface
// errors via a status callback (when provided).

import * as auth from './auth.js';

const LS_KEY = 'savedGraphs';
// Anonymous users are stored in localStorage only, so a small cap keeps
// browser storage modest. Signed-in users sync to Supabase, where we can
// afford to keep effectively their entire history.
const MAX_LOCAL = 10;
const MAX_CLOUD = 500;
// Exported so graphCreator can use the same cap when trimming its in-memory
// list. Function (not const) so it reflects the current auth state, not the
// state at module load.
export function maxGraphs() {
    return auth.isSignedIn() ? MAX_CLOUD : MAX_LOCAL;
}

// ---------- localStorage helpers ----------
function readLocal() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        // Migrate old format (no `data` key) the same way graphCreator used to.
        return parsed.map(g => g && g.data ? g : {
            id: g?.id,
            name: g?.name || 'Untitled',
            data: g,
            timestamp: g?.timestamp || new Date().toISOString(),
            vertices: g?.vertices || 0,
            edges: g?.edges || 0
        });
    } catch (e) {
        console.error('graphStorage: failed to read local', e);
        return [];
    }
}
function writeLocal(graphs) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(graphs));
    } catch (e) {
        console.error('graphStorage: failed to write local', e);
    }
}

// ---------- network helpers ----------
async function fetchRemote() {
    if (!auth.isSignedIn()) return null;
    try {
        const res = await auth.authedFetch('/api/graphs');
        if (!res.ok) {
            console.warn('graphStorage: list /api/graphs returned', res.status);
            return null;
        }
        const body = await res.json();
        return Array.isArray(body?.graphs) ? body.graphs : [];
    } catch (e) {
        console.error('graphStorage: fetchRemote failed', e);
        return null;
    }
}

// We previously tried `keepalive: true` so the request would survive a
// page unload, but Chrome can silently drop those requests (~64 KiB total
// in-flight budget) when the body is non-trivial. With keepalive removed,
// in-page saves work reliably. Navigation-time saves may still get
// cancelled — acceptable since localStorage is always written first.
async function pushRemote(graphs) {
    if (!auth.isSignedIn() || !Array.isArray(graphs) || graphs.length === 0) return;
    console.log('[graphStorage] pushRemote →', graphs.length, 'graph(s)');
    try {
        const res = await auth.authedFetch('/api/graphs', {
            method: 'POST',
            body: JSON.stringify({ graphs }),
            // (intentionally no keepalive — see graphStorage.js comments)
        });
        if (!res.ok) {
            console.warn('[graphStorage] upsert returned', res.status, await res.text().catch(() => ''));
        } else {
            console.log('[graphStorage] pushRemote OK');
        }
    } catch (e) {
        console.error('[graphStorage] pushRemote failed', e);
    }
}

async function deleteRemote(clientId) {
    if (!auth.isSignedIn()) return;
    try {
        const res = await auth.authedFetch('/api/graphs/delete', {
            method: 'POST',
            body: JSON.stringify({ id: clientId }),
            // (intentionally no keepalive — see graphStorage.js comments)
        });
        if (!res.ok) console.warn('[graphStorage] delete returned', res.status);
    } catch (e) {
        console.error('[graphStorage] deleteRemote failed', e);
    }
}

async function clearAllRemote() {
    if (!auth.isSignedIn()) return;
    try {
        const res = await auth.authedFetch('/api/graphs/delete', {
            method: 'POST',
            body: JSON.stringify({ clearAll: true }),
            // (intentionally no keepalive — see graphStorage.js comments)
        });
        if (!res.ok) console.warn('[graphStorage] clearAll returned', res.status);
    } catch (e) {
        console.error('[graphStorage] clearAllRemote failed', e);
    }
}

// ---------- merging ----------
// Merge two lists by client id, preferring whichever entry has the newer
// timestamp. Used when signing in: locals (possibly created anonymously
// before sign-in) get unioned with whatever's already in the user's account.
function mergeByNewest(a, b) {
    const byId = new Map();
    const consider = (g) => {
        if (!g || g.id == null) return;
        const prev = byId.get(g.id);
        if (!prev) { byId.set(g.id, g); return; }
        const prevT = new Date(prev.timestamp || 0).getTime();
        const nextT = new Date(g.timestamp || 0).getTime();
        if (nextT >= prevT) byId.set(g.id, g);
    };
    (a || []).forEach(consider);
    (b || []).forEach(consider);
    return Array.from(byId.values())
        .sort((x, y) => new Date(y.timestamp || 0) - new Date(x.timestamp || 0))
        .slice(0, maxGraphs());
}

// ---------- public API ----------

// Load — fast path returns whatever's cached locally so the UI paints
// immediately. If signed in, fetches the cloud copy and resolves with the
// merged + persisted result (callers should re-render when this resolves).
export async function load() {
    const local = readLocal();
    if (!auth.isSignedIn()) return local;

    const remote = await fetchRemote();
    if (remote === null) return local; // network failure → keep cache

    const merged = mergeByNewest(local, remote);
    writeLocal(merged);

    // Upload anything the server didn't have so this device's anonymously-
    // created graphs end up in the account.
    const remoteIds = new Set(remote.map(g => g.id));
    const toUpload = merged.filter(g => !remoteIds.has(g.id));
    if (toUpload.length) await pushRemote(toUpload);

    return merged;
}

// Save the in-memory list. Always writes to localStorage; if signed in,
// pushes to the cloud in the background.
export function save(graphs) {
    const trimmed = (graphs || []).slice(0, maxGraphs());
    writeLocal(trimmed);
    console.log('[graphStorage] save:', trimmed.length, 'graphs, signedIn=', auth.isSignedIn());
    if (auth.isSignedIn()) {
        // Empty list = explicit clear-all (e.g. "Delete all saved graphs"
        // bulk action). Push that as a separate delete so the cloud doesn't
        // keep orphaned rows.
        if (trimmed.length === 0) {
            clearAllRemote();
        } else {
            // Fire and forget — the local write is the user-visible source
            // of truth, the cloud is best-effort.
            pushRemote(trimmed);
        }
    }
}

// Delete one graph. Caller has typically already removed it from the
// in-memory list and called save(); we still need to push the explicit
// delete so the cloud doesn't keep a stale row past the user's 10 cap.
export async function remove(clientId) {
    if (auth.isSignedIn()) await deleteRemote(clientId);
}

// Called by graphCreator on sign-in / sign-out to refresh the saved list
// from whichever store is now authoritative.
export async function syncOnAuthChange() {
    return load();
}

// ---------- Supabase Realtime ----------
// Subscribe to live INSERT/UPDATE/DELETE events on this user's graphs row.
// Returns an unsubscribe function. `onChange` is called with no arguments
// whenever anything changes — the caller is expected to re-fetch / re-render.
let realtimeChannel = null;

export function subscribeToChanges(onChange) {
    const sb = auth.getSupabase();
    const user = auth.currentUser();
    if (!sb || !user) return () => {};

    // Tear down any previous channel before opening a new one (e.g. on
    // re-subscribe after sign-out/sign-in).
    if (realtimeChannel) {
        try { sb.removeChannel(realtimeChannel); } catch (e) { /* noop */ }
        realtimeChannel = null;
    }

    realtimeChannel = sb
        .channel(`graphs-changes-${user.id}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'graphs',
            filter: `user_id=eq.${user.id}`
        }, (payload) => {
            console.log('[graphStorage] realtime event:', payload.eventType);
            try { onChange(); } catch (e) { console.error(e); }
        })
        .subscribe((status) => {
            console.log('[graphStorage] realtime status:', status);
        });

    return () => {
        if (realtimeChannel) {
            try { sb.removeChannel(realtimeChannel); } catch (e) { /* noop */ }
            realtimeChannel = null;
        }
    };
}

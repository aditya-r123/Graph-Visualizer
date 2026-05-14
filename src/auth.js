// Client-side auth + plan state.
//
// Wraps Supabase JS so the rest of the app can ask three questions:
//   1. Is anyone signed in?  (currentUser())
//   2. Are they on Pro?      (isPro())
//   3. Fire me a fetch with the right Authorization header (authedFetch).
//
// Components that care about state changes subscribe via onChange(cb). The
// callback fires for: sign-in, sign-out, and post-checkout plan refreshes.

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

let supabase = null;
let cachedPlan = 'free';
let cachedUser = null;
const listeners = new Set();

function notify() {
    for (const cb of listeners) {
        try { cb({ user: cachedUser, plan: cachedPlan }); } catch (e) { console.error(e); }
    }
}

export function isConfigured() {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getSupabase() {
    if (!isConfigured()) return null;
    if (!supabase) {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
    }
    return supabase;
}

export function currentUser() { return cachedUser; }
export function currentPlan() { return cachedPlan; }
export function isPro() { return cachedPlan === 'pro'; }
export function isSignedIn() { return Boolean(cachedUser); }

export function onChange(cb) {
    listeners.add(cb);
    // Fire once with current state so subscribers don't have to special-case.
    try { cb({ user: cachedUser, plan: cachedPlan }); } catch (e) { console.error(e); }
    return () => listeners.delete(cb);
}

// Refresh /api/me — call after sign-in, sign-out, and after returning from
// Stripe Checkout (which is when the plan likely changed).
export async function refresh() {
    try {
        const res = await authedFetch('/api/me');
        if (!res.ok) {
            cachedUser = null;
            cachedPlan = 'free';
        } else {
            const body = await res.json();
            cachedUser = body.user || null;
            cachedPlan = body.plan || 'free';
        }
    } catch (err) {
        console.error('auth refresh failed:', err);
        cachedUser = null;
        cachedPlan = 'free';
    }
    notify();
}

// fetch() that automatically attaches the Supabase session JWT if signed in.
export async function authedFetch(input, init = {}) {
    const sb = getSupabase();
    const headers = new Headers(init.headers || {});
    if (sb) {
        const { data } = await sb.auth.getSession();
        const token = data?.session?.access_token;
        if (token) headers.set('Authorization', `Bearer ${token}`);
    }
    if (init.body && !headers.has('Content-Type') && typeof init.body === 'string') {
        headers.set('Content-Type', 'application/json');
    }
    return fetch(input, { ...init, headers });
}

export async function signUp(email, password) {
    const sb = getSupabase();
    if (!sb) throw new Error('Auth not configured');
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) throw error;
    // When Supabase has "Confirm email" enabled, signUp succeeds but no
    // session is returned — the user has to click an email link first.
    // Surface that explicitly so callers can show a useful message instead
    // of silently leaving the UI in a signed-out state.
    if (!data?.session) {
        const err = new Error('Check your email to confirm your account before signing in. (To skip this in dev, disable "Confirm email" in Supabase → Authentication → Providers → Email.)');
        err.code = 'email_confirmation_required';
        throw err;
    }
    await refresh();
    return data;
}

export async function signIn(email, password) {
    const sb = getSupabase();
    if (!sb) throw new Error('Auth not configured');
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await refresh();
    return data;
}

export async function signOut() {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    cachedUser = null;
    cachedPlan = 'free';
    notify();
}

// Kick off Stripe Checkout. Resolves with the URL we should redirect to.
export async function startCheckout() {
    const res = await authedFetch('/api/stripe/create-checkout', { method: 'POST' });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || `Checkout failed (${res.status})`);
    }
    const { url } = await res.json();
    if (!url) throw new Error('Checkout did not return a URL');
    return url;
}

// Permanently delete the signed-in user's account on the server, then
// sign them out locally. Cascades to profiles + graphs.
export async function deleteAccount() {
    const res = await authedFetch('/api/account/delete', { method: 'POST' });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || `Delete failed (${res.status})`);
    }
    // The server has destroyed the auth row; clear the local session too.
    await signOut();
}

// Open the Stripe Customer Portal for self-service cancel/upgrade/etc.
export async function openPortal() {
    const res = await authedFetch('/api/stripe/portal', { method: 'POST' });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || `Portal failed (${res.status})`);
    }
    const { url } = await res.json();
    if (!url) throw new Error('Portal did not return a URL');
    return url;
}

// Wire Supabase's onAuthStateChange so other tabs / token refreshes keep
// the in-memory state honest.
export async function init() {
    if (!isConfigured()) {
        console.warn('Supabase not configured: SUPABASE_URL / SUPABASE_ANON_KEY missing. Auth & AI features disabled.');
        notify();
        return;
    }
    const sb = getSupabase();
    sb.auth.onAuthStateChange((_event, _session) => { refresh(); });
    await refresh();

    // If we just returned from a successful Stripe Checkout, the webhook may
    // not have landed yet. Poll briefly so the UI flips to Pro automatically.
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
        for (let i = 0; i < 6 && cachedPlan !== 'pro'; i++) {
            await new Promise(r => setTimeout(r, 1000));
            await refresh();
        }
        // Strip the query param so a reload doesn't re-poll.
        const url = new URL(window.location.href);
        url.searchParams.delete('checkout');
        window.history.replaceState({}, '', url.toString());
    }
}

// Server-side Supabase clients.
// - admin client: uses the service role key, bypasses RLS. Used by the Stripe
//   webhook to update profiles regardless of who triggered the request.
// - userClientFromBearer(req): builds a per-request client scoped to the
//   caller's JWT, so RLS applies. Used by /api/me and the AI proxy routes.

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Supabase admin client missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var');
    }
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
}

// Parse "Authorization: Bearer <jwt>" and return { user, supabase } scoped to
// that user. Returns { user: null } if no/invalid token — callers decide
// whether to 401.
async function getUserFromRequest(req) {
    const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
    const match = /^Bearer\s+(.+)$/i.exec(authHeader);
    if (!match) return { user: null, supabase: null, token: null };

    const token = match[1];
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return { user: null, supabase: null, token };
    return { user: data.user, supabase, token };
}

// Returns the user's plan ('free' | 'pro'). Reads via the admin client to
// avoid the round-trip through RLS — we already authenticated the user.
async function getPlan(userId) {
    const admin = getAdminClient();
    const { data, error } = await admin
        .from('profiles')
        .select('plan, current_period_end')
        .eq('id', userId)
        .maybeSingle();
    if (error) throw error;
    if (!data) return 'free';
    // If a Pro subscription's period has ended (webhook should have caught
    // this, but belt-and-suspenders) downgrade in memory.
    if (data.plan === 'pro' && data.current_period_end && new Date(data.current_period_end) < new Date()) {
        return 'free';
    }
    return data.plan || 'free';
}

// Ensure a profiles row exists for this user. The SQL trigger
// `on_auth_user_created` should handle this at sign-up, but if the trigger
// isn't installed (or silently failed), this is the safety net — called on
// every /api/me hit so the row gets backfilled the first time a user comes
// back to a server route.
async function ensureProfile(user) {
    if (!user?.id) return;
    const admin = getAdminClient();
    const { error } = await admin
        .from('profiles')
        .upsert({ id: user.id, email: user.email }, { onConflict: 'id', ignoreDuplicates: false });
    if (error) {
        console.warn('ensureProfile failed:', error.message);
    }
}

module.exports = { getAdminClient, getUserFromRequest, getPlan, ensureProfile };

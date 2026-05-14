// Plain async (req, res) handlers, shared by Vercel serverless functions
// (each /api/*.js file just re-exports one of these) and by server.js for
// local Express dev. Keeping them framework-agnostic means one source of
// truth and the same code path runs locally and in prod.

const OpenAI = require('openai');
const Stripe = require('stripe');

const { getUserFromRequest, getPlan, getAdminClient, ensureProfile } = require('./supabase');

const ORIGIN = process.env.APP_ORIGIN || 'http://localhost:3005';
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function getStripe() {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
    return new Stripe(process.env.STRIPE_SECRET_KEY);
}
function getOpenAI() {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function sendJson(res, status, body) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
}

async function requirePro(req, res) {
    const { user } = await getUserFromRequest(req);
    if (!user) {
        sendJson(res, 401, { error: 'sign_in_required', message: 'Sign in to use AI features.' });
        return null;
    }
    const plan = await getPlan(user.id);
    if (plan !== 'pro') {
        sendJson(res, 402, { error: 'pro_required', message: 'AI is a Pro feature. Upgrade to continue.' });
        return null;
    }
    return user;
}

// ---------------------------------------------------------------------------
// GET /api/me  — returns the current user (or null) + plan.
// ---------------------------------------------------------------------------
async function meHandler(req, res) {
    const { user } = await getUserFromRequest(req);
    if (!user) return sendJson(res, 200, { user: null, plan: 'free' });
    // Backfill the profile row if the SQL trigger didn't create one. Safe
    // to call every time — it's an upsert with ON CONFLICT DO NOTHING-ish
    // semantics for the new-row case.
    await ensureProfile(user);
    const plan = await getPlan(user.id);
    return sendJson(res, 200, {
        user: { id: user.id, email: user.email },
        plan
    });
}

// ---------------------------------------------------------------------------
// POST /api/ai/generate-graph
// Body: { prompt: string }  (clamped server-side at 500 chars)
// Returns OpenAI's JSON content verbatim for the client to parse.
// ---------------------------------------------------------------------------
async function generateGraphHandler(req, res) {
    const user = await requirePro(req, res);
    if (!user) return;

    let body = req.body;
    if (!body) {
        try { body = await readJsonBody(req); } catch { return sendJson(res, 400, { error: 'bad_json' }); }
    }
    const prompt = String(body?.prompt || '').slice(0, 500).trim();
    if (!prompt) return sendJson(res, 400, { error: 'empty_prompt' });

    const systemPrompt = `You design graph structures. Output ONLY valid JSON matching this schema:
{
  "vertices": [{
    "id": <int>, "x": <int>, "y": <int>, "label": "<string>",
    "shape": "circle|square|triangle|diamond|star|pentagon|hexagon",
    "size": <int 15-60>,
    "color": "<hex #rrggbb>",
    "borderColor": "<hex #rrggbb>",
    "fontColor": "<hex #rrggbb>"
  }],
  "edges": [{
    "from": <vertex id>, "to": <vertex id>,
    "directed": <true|false>,
    "type": "straight|curved",
    "lineStyle": "solid|dashed",
    "weight": "<string, optional>"
  }],
  "globals": {
    "vertexColor": "<hex>", "vertexBorderColor": "<hex>", "vertexFontColor": "<hex>",
    "edgeColor": "<hex>", "edgeFontColor": "<hex>",
    "edgeType": "straight|curved", "edgeDirection": "directed|undirected"
  }
}
Layout rules:
- Canvas is 2000x2000. Keep x,y within [100, 1900].
- Minimum 120px spacing between any two vertices.
- Layered structures (neural nets, pipelines): arrange layers left-to-right by x, distribute vertices vertically by y.
- Trees: root at low y, children spread below.
- Cycles/rings: distribute around a circle.
Styling rules:
- All styling fields are OPTIONAL. Only include fields the user explicitly requests or that the description strongly implies (e.g. "red nodes" -> color, "dashed edges" -> lineStyle:"dashed"). Omit fields otherwise so defaults apply.
- Per-vertex/edge fields override "globals". Use "globals" when ALL vertices/edges share the same styling.
- "directed" on an edge defaults to false. Use true when the description implies direction (forward pass, dependency, flow).
- For colors: translate natural-language colors to hex (red->#ef4444, blue->#3b82f6, green->#22c55e, yellow->#eab308, purple->#a855f7, orange->#f97316, black->#000000, white->#ffffff, gray->#6b7280).
General rules:
- Labels: 1-3 words.
- ids: unique positive integers starting at 1.
- Every edge's from/to must reference an existing vertex id.
- No commentary, no markdown, no code fences. JSON only.`;

    try {
        const openai = getOpenAI();
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 2000,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ]
        });
        const content = completion?.choices?.[0]?.message?.content;
        if (!content) return sendJson(res, 502, { error: 'empty_ai_response' });
        return sendJson(res, 200, { content });
    } catch (err) {
        console.error('generate-graph failed:', err?.message || err);
        return sendJson(res, 502, { error: 'openai_error', message: err?.message || 'unknown' });
    }
}

// ---------------------------------------------------------------------------
// POST /api/ai/hierarchy
// Body: { imageDataUrl: string }  — vision call that returns a text tree.
// ---------------------------------------------------------------------------
async function hierarchyHandler(req, res) {
    const user = await requirePro(req, res);
    if (!user) return;

    let body = req.body;
    if (!body) {
        try { body = await readJsonBody(req); } catch { return sendJson(res, 400, { error: 'bad_json' }); }
    }
    const imageDataUrl = String(body?.imageDataUrl || '');
    if (!imageDataUrl.startsWith('data:image/')) {
        return sendJson(res, 400, { error: 'invalid_image' });
    }

    const prompt = `Generate text-based file tree from the image using "|", "_", and spaces Rules: Indent childs with "|___", align under the parent's vertical "|".Place labels right after underscores. Put unconnected nodes on new line at root lvl. Output only diagram`;

    try {
        const openai = getOpenAI();
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 500,
            temperature: 0.1,
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: imageDataUrl } }
                ]
            }]
        });
        const raw = completion?.choices?.[0]?.message?.content || '';
        const cleaned = raw.replace(/`/g, '').trim();
        return sendJson(res, 200, { content: cleaned });
    } catch (err) {
        console.error('hierarchy failed:', err?.message || err);
        return sendJson(res, 502, { error: 'openai_error', message: err?.message || 'unknown' });
    }
}

// ---------------------------------------------------------------------------
// POST /api/stripe/create-checkout-session
// Creates a Checkout session for the configured Pro price and returns the URL.
// ---------------------------------------------------------------------------
async function createCheckoutHandler(req, res) {
    const { user } = await getUserFromRequest(req);
    if (!user) return sendJson(res, 401, { error: 'sign_in_required' });
    if (!STRIPE_PRICE_ID) return sendJson(res, 500, { error: 'stripe_price_not_configured' });

    try {
        const stripe = getStripe();
        const admin = getAdminClient();

        // Look up or create the Stripe customer for this user.
        const { data: profile } = await admin
            .from('profiles')
            .select('stripe_customer_id, email')
            .eq('id', user.id)
            .maybeSingle();

        let customerId = profile?.stripe_customer_id;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { supabase_user_id: user.id }
            });
            customerId = customer.id;
            await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
            success_url: `${ORIGIN}/editor?checkout=success`,
            cancel_url: `${ORIGIN}/editor?checkout=cancelled`,
            allow_promotion_codes: true,
            client_reference_id: user.id,
            metadata: { supabase_user_id: user.id }
        });
        return sendJson(res, 200, { url: session.url });
    } catch (err) {
        console.error('create-checkout failed:', err?.message || err);
        return sendJson(res, 500, { error: 'stripe_error', message: err?.message || 'unknown' });
    }
}

// ---------------------------------------------------------------------------
// POST /api/stripe/portal
// Returns a Customer Portal URL so the user can manage / cancel.
// ---------------------------------------------------------------------------
async function portalHandler(req, res) {
    const { user } = await getUserFromRequest(req);
    if (!user) return sendJson(res, 401, { error: 'sign_in_required' });

    try {
        const stripe = getStripe();
        const admin = getAdminClient();
        const { data: profile } = await admin
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .maybeSingle();
        if (!profile?.stripe_customer_id) {
            return sendJson(res, 400, { error: 'no_customer' });
        }
        const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: `${ORIGIN}/editor`
        });
        return sendJson(res, 200, { url: session.url });
    } catch (err) {
        console.error('portal failed:', err?.message || err);
        return sendJson(res, 500, { error: 'stripe_error', message: err?.message || 'unknown' });
    }
}

// ---------------------------------------------------------------------------
// POST /api/stripe/webhook
// Stripe signs the raw body — we need the raw bytes, not the parsed JSON.
// In Vercel, we export `config.api.bodyParser = false` so req is a stream.
// In Express, we mount express.raw() on this path.
// ---------------------------------------------------------------------------
async function webhookHandler(req, res, rawBodyBuffer) {
    if (!STRIPE_WEBHOOK_SECRET) {
        return sendJson(res, 500, { error: 'webhook_secret_not_configured' });
    }
    const sig = req.headers['stripe-signature'];
    if (!sig) return sendJson(res, 400, { error: 'missing_signature' });

    const stripe = getStripe();
    const admin = getAdminClient();

    let event;
    try {
        const body = rawBodyBuffer || (await readRawBody(req));
        event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('webhook signature verification failed:', err?.message || err);
        return sendJson(res, 400, { error: 'invalid_signature' });
    }

    try {
        // Stripe does NOT guarantee event delivery order. A late-arriving
        // `customer.subscription.created` with status=incomplete (the
        // momentary state before payment confirms) used to overwrite a
        // correctly-marked Pro user back to free. To make this safe:
        //
        //   - "Pro-granting" statuses (active, trialing) always set plan=pro
        //     and bump current_period_end forward.
        //   - "Pro-revoking" statuses (canceled, incomplete_expired, unpaid)
        //     always set plan=free.
        //   - Anything else (incomplete, past_due, paused, etc.) updates
        //     status fields but DOES NOT touch the plan column — so a late
        //     "incomplete" event won't downgrade an already-Pro user.

        const PRO_STATUSES = new Set(['active', 'trialing']);
        const FREE_STATUSES = new Set(['canceled', 'incomplete_expired', 'unpaid']);

        const subscriptionUpdate = (sub) => {
            const update = {
                stripe_subscription_id: sub.id,
                subscription_status: sub.status,
                current_period_end: sub.current_period_end
                    ? new Date(sub.current_period_end * 1000).toISOString()
                    : null
            };
            if (PRO_STATUSES.has(sub.status)) update.plan = 'pro';
            else if (FREE_STATUSES.has(sub.status)) update.plan = 'free';
            // else: leave `plan` alone (don't risk demoting a paid user)
            return update;
        };

        console.log('[webhook] received', event.type, event.id);

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.client_reference_id || session.metadata?.supabase_user_id;
                if (userId && session.subscription) {
                    const sub = await stripe.subscriptions.retrieve(session.subscription);
                    const update = {
                        stripe_customer_id: session.customer,
                        ...subscriptionUpdate(sub)
                    };
                    const { error } = await admin.from('profiles').update(update).eq('id', userId);
                    if (error) console.error('[webhook] checkout update failed:', error);
                    else console.log('[webhook] checkout updated profile', userId, 'plan=' + (update.plan || '(unchanged)'));
                }
                break;
            }
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                // Find the profile by customer id (more reliable than metadata).
                const { data: profile, error: lookupErr } = await admin
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', sub.customer)
                    .maybeSingle();
                if (lookupErr) console.error('[webhook] profile lookup failed:', lookupErr);
                if (profile) {
                    // Delete events explicitly mean canceled — force plan=free
                    // even if Stripe momentarily reports a different status.
                    const update = subscriptionUpdate(sub);
                    if (event.type === 'customer.subscription.deleted') update.plan = 'free';
                    const { error } = await admin.from('profiles').update(update).eq('id', profile.id);
                    if (error) console.error('[webhook] sub update failed:', error);
                    else console.log('[webhook] sub event updated profile', profile.id, 'plan=' + (update.plan || '(unchanged)'));
                } else {
                    console.warn('[webhook] no profile found for stripe_customer_id', sub.customer);
                }
                break;
            }
            default:
                // Unhandled event types are fine — acknowledge so Stripe doesn't retry.
                break;
        }
        return sendJson(res, 200, { received: true });
    } catch (err) {
        console.error('webhook processing error:', err?.message || err);
        return sendJson(res, 500, { error: 'webhook_processing_failed' });
    }
}

// ---------- request body helpers ----------
function readRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}
async function readJsonBody(req) {
    const buf = await readRawBody(req);
    if (!buf.length) return {};
    return JSON.parse(buf.toString('utf8'));
}

// ---------------------------------------------------------------------------
// Canvas Management sync ("/api/graphs/*")
//
// The editor's saved-graphs list (up to 10 entries) is mirrored here for
// signed-in users so it follows them across devices. Anonymous users keep
// using localStorage only — these endpoints all require a JWT.
//
// `client_id` is the Date.now() identifier the editor assigns at save time;
// it's how local rows match server rows during the post-sign-in merge.
// ---------------------------------------------------------------------------

// Per-user history cap. 500 is effectively "all-time" for any realistic
// usage while still bounding storage so a runaway client can't fill the
// table. The sidebar widget separately slices to its own small display
// limit; this only caps what gets persisted.
const GRAPH_LIMIT = 500;
const GRAPH_NAME_MAX = 200;
// Hard cap on a single graph's JSON size so a runaway client can't blow up
// the row. ~256 KiB is comfortably more than the largest realistic graph.
const GRAPH_DATA_MAX_BYTES = 256 * 1024;

async function listGraphsHandler(req, res) {
    const { user } = await getUserFromRequest(req);
    if (!user) return sendJson(res, 401, { error: 'sign_in_required' });

    try {
        const admin = getAdminClient();
        const { data, error } = await admin
            .from('graphs')
            .select('client_id, name, data, vertex_count, edge_count, updated_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(GRAPH_LIMIT);
        if (error) throw error;
        return sendJson(res, 200, {
            graphs: (data || []).map(row => ({
                id: Number(row.client_id),
                name: row.name,
                data: row.data,
                vertices: row.vertex_count,
                edges: row.edge_count,
                timestamp: row.updated_at
            }))
        });
    } catch (err) {
        console.error('list-graphs failed:', err?.message || err);
        return sendJson(res, 500, { error: 'list_failed', message: err?.message });
    }
}

// POST /api/graphs
// Body: { graphs: [{ id, name, data, vertices, edges, timestamp }, ...] }
// Upserts the list (replaces existing rows by client_id) and trims the
// user's set to the top 10 most-recent rows.
async function upsertGraphsHandler(req, res) {
    const { user } = await getUserFromRequest(req);
    if (!user) return sendJson(res, 401, { error: 'sign_in_required' });

    // Under Express, express.json() has already parsed req.body. Under
    // Vercel serverless, we need to read it from the stream.
    let body = req.body;
    if (!body) {
        try { body = await readJsonBody(req); }
        catch { return sendJson(res, 400, { error: 'bad_json' }); }
    }

    const incoming = Array.isArray(body?.graphs) ? body.graphs : [];
    if (incoming.length === 0) return sendJson(res, 200, { upserted: 0 });
    if (incoming.length > GRAPH_LIMIT * 2) {
        return sendJson(res, 400, { error: 'too_many', message: `Send at most ${GRAPH_LIMIT * 2} at a time` });
    }

    // Validate + reshape each row.
    const rows = [];
    for (const g of incoming) {
        const clientId = Number(g?.id);
        if (!Number.isFinite(clientId)) {
            return sendJson(res, 400, { error: 'invalid_id' });
        }
        const name = String(g?.name || 'Untitled').slice(0, GRAPH_NAME_MAX);
        const data = g?.data;
        if (!data || typeof data !== 'object') {
            return sendJson(res, 400, { error: 'invalid_data' });
        }
        const dataStr = JSON.stringify(data);
        if (dataStr.length > GRAPH_DATA_MAX_BYTES) {
            return sendJson(res, 413, { error: 'graph_too_large', message: 'Graph exceeds 256 KiB' });
        }
        rows.push({
            user_id: user.id,
            client_id: clientId,
            name,
            data,
            vertex_count: Number.isFinite(Number(g?.vertices)) ? Math.max(0, Math.floor(Number(g.vertices))) : 0,
            edge_count: Number.isFinite(Number(g?.edges)) ? Math.max(0, Math.floor(Number(g.edges))) : 0,
            updated_at: g?.timestamp ? new Date(g.timestamp).toISOString() : new Date().toISOString()
        });
    }

    try {
        const admin = getAdminClient();
        const { error: upsertErr } = await admin
            .from('graphs')
            .upsert(rows, { onConflict: 'user_id,client_id' });
        if (upsertErr) throw upsertErr;

        // Trim to the latest 10 — drop everything older. Keeps storage tidy
        // and matches the client-side cap.
        const { data: keep, error: keepErr } = await admin
            .from('graphs')
            .select('id')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(GRAPH_LIMIT);
        if (keepErr) throw keepErr;
        if (keep && keep.length === GRAPH_LIMIT) {
            const keepIds = keep.map(r => r.id);
            await admin
                .from('graphs')
                .delete()
                .eq('user_id', user.id)
                .not('id', 'in', `(${keepIds.map(id => `"${id}"`).join(',')})`);
        }

        return sendJson(res, 200, { upserted: rows.length });
    } catch (err) {
        console.error('upsert-graphs failed:', err?.message || err);
        return sendJson(res, 500, { error: 'upsert_failed', message: err?.message });
    }
}

// POST /api/graphs/delete  Body: { id: <clientId> } | { clearAll: true }
async function deleteGraphHandler(req, res) {
    const { user } = await getUserFromRequest(req);
    if (!user) return sendJson(res, 401, { error: 'sign_in_required' });

    let body = req.body;
    if (!body) {
        try { body = await readJsonBody(req); }
        catch { return sendJson(res, 400, { error: 'bad_json' }); }
    }

    const admin = getAdminClient();

    if (body?.clearAll === true) {
        try {
            const { error } = await admin
                .from('graphs')
                .delete()
                .eq('user_id', user.id);
            if (error) throw error;
            return sendJson(res, 200, { cleared: true });
        } catch (err) {
            console.error('clear-graphs failed:', err?.message || err);
            return sendJson(res, 500, { error: 'clear_failed', message: err?.message });
        }
    }

    const clientId = Number(body?.id);
    if (!Number.isFinite(clientId)) return sendJson(res, 400, { error: 'invalid_id' });

    try {
        const { error } = await admin
            .from('graphs')
            .delete()
            .eq('user_id', user.id)
            .eq('client_id', clientId);
        if (error) throw error;
        return sendJson(res, 200, { deleted: clientId });
    } catch (err) {
        console.error('delete-graph failed:', err?.message || err);
        return sendJson(res, 500, { error: 'delete_failed', message: err?.message });
    }
}

module.exports = {
    meHandler,
    generateGraphHandler,
    hierarchyHandler,
    createCheckoutHandler,
    portalHandler,
    webhookHandler,
    listGraphsHandler,
    upsertGraphsHandler,
    deleteGraphHandler,
    sendJson
};

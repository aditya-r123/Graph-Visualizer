// Plain async (req, res) handlers, shared by Vercel serverless functions
// (each /api/*.js file just re-exports one of these) and by server.js for
// local Express dev. Keeping them framework-agnostic means one source of
// truth and the same code path runs locally and in prod.

const OpenAI = require('openai');
const Stripe = require('stripe');

const { getUserFromRequest, getPlan, getAdminClient } = require('./supabase');

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
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.client_reference_id || session.metadata?.supabase_user_id;
                if (userId && session.subscription) {
                    const sub = await stripe.subscriptions.retrieve(session.subscription);
                    await admin.from('profiles').update({
                        stripe_customer_id: session.customer,
                        stripe_subscription_id: sub.id,
                        plan: sub.status === 'active' || sub.status === 'trialing' ? 'pro' : 'free',
                        subscription_status: sub.status,
                        current_period_end: sub.current_period_end
                            ? new Date(sub.current_period_end * 1000).toISOString()
                            : null
                    }).eq('id', userId);
                }
                break;
            }
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                // Find the profile by customer id (more reliable than metadata).
                const { data: profile } = await admin
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', sub.customer)
                    .maybeSingle();
                if (profile) {
                    const isActive = sub.status === 'active' || sub.status === 'trialing';
                    await admin.from('profiles').update({
                        stripe_subscription_id: sub.id,
                        plan: isActive ? 'pro' : 'free',
                        subscription_status: sub.status,
                        current_period_end: sub.current_period_end
                            ? new Date(sub.current_period_end * 1000).toISOString()
                            : null
                    }).eq('id', profile.id);
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

module.exports = {
    meHandler,
    generateGraphHandler,
    hierarchyHandler,
    createCheckoutHandler,
    portalHandler,
    webhookHandler,
    sendJson
};

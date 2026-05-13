// Local dev server. In production, Vercel serves /api/* as serverless
// functions and the rest as static. Here we mount the same handlers on an
// Express app so `npm run dev` exercises the real auth/billing code path.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const {
    meHandler,
    generateGraphHandler,
    hierarchyHandler,
    createCheckoutHandler,
    portalHandler,
    webhookHandler
} = require('./api/_lib/handlers');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());

// Stripe webhook MUST receive the raw body for signature verification — mount
// it BEFORE express.json(), with the raw body parser.
app.post('/api/stripe/webhook',
    express.raw({ type: 'application/json' }),
    (req, res) => webhookHandler(req, res, req.body)
);

// Everything else uses JSON body parsing.
app.use(express.json({ limit: '15mb' })); // 15mb to fit data: URLs for vision

// Static files with no-cache for dev.
app.use(express.static('public', {
    setHeaders: (res, p) => {
        if (p.endsWith('.js') || p.endsWith('.css') || p.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// HTML routes.
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/editor', (req, res) => res.sendFile(path.join(__dirname, 'public', 'editor.html')));

// API routes — wrap with try/catch so a thrown error surfaces as a 500 JSON.
const wrap = (fn) => async (req, res) => {
    try { await fn(req, res); }
    catch (err) {
        console.error('handler error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'server_error', message: err?.message || 'unknown' });
        }
    }
};

app.get('/api/me', wrap(meHandler));
app.post('/api/ai/generate-graph', wrap(generateGraphHandler));
app.post('/api/ai/hierarchy', wrap(hierarchyHandler));
app.post('/api/stripe/create-checkout', wrap(createCheckoutHandler));
app.post('/api/stripe/portal', wrap(portalHandler));

// Legacy public-config endpoint — returns the client-safe keys.
app.get('/api/public-config', (req, res) => {
    res.json({
        supabaseUrl: process.env.SUPABASE_URL || '',
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
        emailjs: {
            publicKey: process.env.EMAILJS_PUBLIC_KEY || '',
            serviceId: process.env.EMAILJS_SERVICE_ID || '',
            templateId: process.env.EMAILJS_TEMPLATE_ID || ''
        }
    });
});

// Back-compat: old endpoint name some clients may still call.
app.get('/api/emailjs-config', (req, res) => {
    res.json({
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        serviceId: process.env.EMAILJS_SERVICE_ID,
        templateId: process.env.EMAILJS_TEMPLATE_ID
    });
});

app.listen(PORT, () => {
    console.log(`Graph Creator server running on http://localhost:${PORT}`);
});

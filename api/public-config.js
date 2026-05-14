// Returns the client-safe public keys + the Pro plan's actual price (so the
// landing page can render real dollars instead of a placeholder).
const Stripe = require('stripe');
const { sendJson } = require('./_lib/handlers');

let cachedPrice = null;
let cachedPriceAt = 0;
const PRICE_TTL_MS = 5 * 60 * 1000;

async function fetchProPrice() {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) return null;
    if (cachedPrice && Date.now() - cachedPriceAt < PRICE_TTL_MS) return cachedPrice;
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID);
        cachedPrice = {
            amount: price.unit_amount,        // cents
            currency: price.currency,         // 'usd'
            interval: price.recurring?.interval || 'month',
            intervalCount: price.recurring?.interval_count || 1
        };
        cachedPriceAt = Date.now();
        return cachedPrice;
    } catch (err) {
        console.warn('fetchProPrice failed:', err?.message || err);
        return null;
    }
}

module.exports = async (req, res) => {
    const proPrice = await fetchProPrice();
    sendJson(res, 200, {
        supabaseUrl: process.env.SUPABASE_URL || '',
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
        proPrice, // null if Stripe isn't configured
        emailjs: {
            publicKey: process.env.EMAILJS_PUBLIC_KEY || '',
            serviceId: process.env.EMAILJS_SERVICE_ID || '',
            templateId: process.env.EMAILJS_TEMPLATE_ID || ''
        }
    });
};

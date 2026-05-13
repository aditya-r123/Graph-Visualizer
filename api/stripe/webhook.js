// Stripe signs the raw request body — we need the bytes unparsed.
// Disabling Vercel's default body parser lets us read req as a stream.
const { webhookHandler } = require('../_lib/handlers');

module.exports = (req, res) => webhookHandler(req, res);

module.exports.config = {
    api: { bodyParser: false }
};

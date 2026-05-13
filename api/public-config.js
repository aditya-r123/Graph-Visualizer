// Returns the client-safe public keys. These would also work as build-time
// constants in webpack, but serving them at runtime lets the same build run
// against different Supabase projects (e.g. preview vs production) without
// rebuilding.
const { sendJson } = require('./_lib/handlers');

module.exports = (req, res) => {
    sendJson(res, 200, {
        supabaseUrl: process.env.SUPABASE_URL || '',
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
        // EmailJS (already used by the contact form)
        emailjs: {
            publicKey: process.env.EMAILJS_PUBLIC_KEY || '',
            serviceId: process.env.EMAILJS_SERVICE_ID || '',
            templateId: process.env.EMAILJS_TEMPLATE_ID || ''
        }
    });
};

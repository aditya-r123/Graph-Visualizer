// Client-side configuration.
//
// Public keys only. Anything sensitive (OpenAI key, Stripe secret, Supabase
// service-role key) lives ONLY on the server side and is reached via /api/*.
//
// The Supabase URL + anon key are designed to be public — what protects user
// data is the Row Level Security policies in supabase/schema.sql, not the
// secrecy of these keys.

export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export const EMAILJS_CONFIG = {
    PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY,
    SERVICE_ID: process.env.EMAILJS_SERVICE_ID,
    TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID
};

export const isProduction = () => {
    return window.location.hostname !== 'localhost' &&
           window.location.hostname !== '127.0.0.1' &&
           !window.location.hostname.includes('localhost');
};

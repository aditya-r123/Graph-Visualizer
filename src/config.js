// EmailJS Configuration
// These values will be replaced at build time by Vercel's environment variables
export const EMAILJS_CONFIG = {
    PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY,
    SERVICE_ID: process.env.EMAILJS_SERVICE_ID, 
    TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID
};

// OpenAI Configuration
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Environment detection
export const isProduction = () => {
    return window.location.hostname !== 'localhost' && 
           window.location.hostname !== '127.0.0.1' &&
           !window.location.hostname.includes('localhost');
}; 
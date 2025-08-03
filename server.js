// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
// Change the port to 3002
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Add cache-busting headers for static files
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js') || path.endsWith('.css') || path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API routes for future graph operations
app.get('/api/graph', (req, res) => {
    res.json({ message: 'Graph API endpoint' });
});

// EmailJS configuration endpoint
app.get('/api/emailjs-config', (req, res) => {
    res.json({
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        serviceId: process.env.EMAILJS_SERVICE_ID,
        templateId: process.env.EMAILJS_TEMPLATE_ID
    });
});

// Cache-busting endpoint
app.get('/api/clear-cache', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({ message: 'Cache cleared', timestamp: Date.now() });
});

app.listen(PORT, () => {
    console.log(`🚀 Graph Creator server running on http://localhost:${PORT}`);
    console.log(`📱 Open your browser and navigate to the URL above`);
}); 
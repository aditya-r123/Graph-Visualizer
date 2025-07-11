const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
// Change the port to 3002
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API routes for future graph operations
app.get('/api/graph', (req, res) => {
    res.json({ message: 'Graph API endpoint' });
});

app.listen(PORT, () => {
    console.log(`🚀 Graph Creator server running on http://localhost:${PORT}`);
    console.log(`📱 Open your browser and navigate to the URL above`);
}); 
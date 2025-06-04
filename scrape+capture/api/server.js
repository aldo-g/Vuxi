require('dotenv').config({ path: '../.env' }); // Load your existing .env
const express = require('express');
const cors = require('cors');
const path = require('path');
const captureRoutes = require('./routes/capture');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Your React app
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', captureRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Website Capture API running on port ${PORT}`);
  console.log(`📸 Endpoints: http://localhost:${PORT}/api/capture`);
});
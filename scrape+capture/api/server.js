// aldo-g/web-analysis/Web-analysis-ce47fd73470b9414e2e4feac630ba53f4f991579/scrape+capture/api/server.js
require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const captureRoutes = require('./routes/capture');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Define allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173', // Vite default
  'http://localhost:5174'  // The port you are currently using
];

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
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
  console.log(`💡 Allowing origins: ${allowedOrigins.join(', ')}`);
});
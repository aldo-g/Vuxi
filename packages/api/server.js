require('dotenv').config({ path: '../../.env' });

const express = require('express');
const cors = require('cors');
const captureRoutes = require('./routes/capture.js');
const userRoutes = require('./routes/users.js'); // <-- 1. Import the new user routes

const app = express();
const PORT = process.env.PORT || 3001;

// Allowed origins for CORS
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- API ROUTES ---
app.use('/api', captureRoutes);
app.use('/api/users', userRoutes); // <-- 2. Use the new routes under /api/users

// Simple root endpoint for checking if the server is up
app.get('/', (req, res) => {
    res.send('Welcome to the Vuxi Website Capture API!');
});

app.listen(PORT, () => {
    console.log(`🚀 Website Capture API running on port ${PORT}`);
    console.log(`📸 Capture Endpoints: http://localhost:${PORT}/api/capture`);
    console.log(`👤 User Endpoints: http://localhost:${PORT}/api/users`);
    console.log(`💡 Allowing origins: ${allowedOrigins.join(', ')}`);
});

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const { getJob, setJob, updateJob } = require('./lib/jobManager');

// Import routers
const usersRouter = require('./routes/users');
const captureRouter = require('./routes/capture');
const projectsRouter = require('./routes/projects'); // The new projects router
const authRouter = require('./routes/auth');

const app = express();
const port = 3001;

// CORS configuration
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Define API Routes
app.use('/api/users', usersRouter);
app.use('/api/capture', captureRouter);
app.use('/api/projects', projectsRouter); // Use the new projects router
app.use('/api/auth', authRouter);

// Welcome route
app.get('/', (req, res) => {
  res.send('Welcome to the Vuxi Website Capture API');
});

console.log(`🚀 Website Capture API running on port ${port}`);
console.log(`📸 Capture Endpoints: http://localhost:${port}/api/capture`);
console.log(`👤 User Endpoints: http://localhost:${port}/api/users`);
console.log(`💡 Allowing origins: ${allowedOrigins.join(', ')}`);

app.listen(port, () => {
  // Note: The console logs are moved above to show status immediately
});
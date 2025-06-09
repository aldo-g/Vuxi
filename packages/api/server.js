const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const captureRouter = require('./routes/capture');
const projectsRouter = require('./routes/projects');

const app = express();
const port = process.env.PORT || 3001;

// --- THIS IS THE UPDATED CORS SETUP ---
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];
const corsOptions = {
  origin: allowedOrigins,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  // This explicitly allows the Authorization header
  allowedHeaders: 'Content-Type,Authorization' 
};
app.use(cors(corsOptions));
// --- END OF UPDATE ---

app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/capture', captureRouter);
app.use('/api/projects', projectsRouter);

app.get('/', (req, res) => {
  res.send('Welcome to the Website Capture API');
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
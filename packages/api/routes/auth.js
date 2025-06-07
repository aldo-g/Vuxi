const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const saltRounds = 10;

// ==========================================================
// @route   POST /api/auth/register
// @desc    Register a new user and return a token
// @access  Public
// ==========================================================
router.post('/register', async (req, res) => {
  try {
    const { Name, email, password } = req.body;

    if (!Name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);

    user = await prisma.user.create({
      data: {
        Name,
        email,
        passwordHash,
      },
    });

    const payload = {
      user: {
        id: user.id,
      },
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' } // We recommend a shorter lifespan for production apps
    );
    
    // We don't want to send the password hash back to the client
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json({ token, user: userWithoutPassword });

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});


// ==========================================================
// @route   POST /api/auth/login
// @desc    Authenticate an existing user and return a token
// @access  Public
// ==========================================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' }
    );
    
    res.json({ token });

  } catch (err) {
    console.error('Error during login:', err.message);
    res.status(500).send('Server error');
  }
});


module.exports = router;
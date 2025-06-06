const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');

const saltRounds = 10; // Standard value for bcrypt hashing

// POST /api/users - Create a new user
router.post('/', async (req, res) => {
  try {
    const { fullName, email, notificationEmail, password } = req.body;

    // --- Validation ---
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // --- Password Hashing ---
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // --- Create User in Database ---
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        notificationEmail: notificationEmail || email, // Default to main email if not provided
        passwordHash,
      },
    });

    // Don't send the password hash back to the client
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    res.status(201).json({ user: userWithoutPassword, message: 'User created successfully.' });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

module.exports = router;
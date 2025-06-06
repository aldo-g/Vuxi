const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const saltRounds = 10;

router.post('/', async (req, res) => {
  try {
    // Expect "Name" with a capital N from the request body
    const { Name, email, password } = req.body;

    // This validation check also expects "Name" with a capital N
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
        Name, // This uses the destructured "Name" variable
        email,
        passwordHash,
      },
    });

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.status(201).json({ token, user: userWithoutPassword });
      }
    );

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

module.exports = router;
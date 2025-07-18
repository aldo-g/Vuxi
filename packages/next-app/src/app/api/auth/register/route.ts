import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

export async function POST(request: Request) {
  try {
    const { Name, email, password } = await request.json();

    // Validate input
    if (!Name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user in the database
    const user = await prisma.user.create({
      data: {
        Name,
        email,
        passwordHash: hashedPassword,
      },
    });

    // Create the JWT token with number ID
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new jose.SignJWT({ 
      userId: user.id,        // user.id is already a number
      email: user.email 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .setIssuedAt()
      .sign(secret);

    // Create a response and set the token in a secure, httpOnly cookie
    const response = NextResponse.json({ message: 'User created successfully' }, { status: 201 });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}
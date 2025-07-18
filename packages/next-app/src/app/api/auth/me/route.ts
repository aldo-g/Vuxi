import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/database';
import * as jose from 'jose';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    const userId = payload.userId as number; // Change to number

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }, // This should work now since userId is a number
      select: { 
        id: true,    // Include the id in the response
        Name: true, 
        email: true 
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error('API /me Error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
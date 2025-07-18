import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import prisma from '@/lib/database';

// This function handles GET requests to /api/projects
export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    // If no token, return 401 Unauthorized
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    // Verify the token using the secret key from your environment variables
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    if (!payload.userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    
    // Fetch projects for the authenticated user with their analysis runs
    const projects = await prisma.project.findMany({
      where: {
        userId: payload.userId as number,
      },
      include: {
        analysisRuns: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            status: true,
            overallScore: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(projects);

  } catch (error) {
    console.error('API Error:', error);
    // If token is invalid or another error occurs
    return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
  }
}
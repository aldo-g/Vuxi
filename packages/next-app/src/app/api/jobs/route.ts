import { NextRequest, NextResponse } from 'next/server';

const CAPTURE_SERVICE_URL = process.env.CAPTURE_SERVICE_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward request to capture service
    const response = await fetch(`${CAPTURE_SERVICE_URL}/api/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    const result = await response.json();
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create analysis job' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get all jobs for debugging
    const response = await fetch(`${CAPTURE_SERVICE_URL}/api/jobs`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: response.status }
      );
    }
    
    const jobs = await response.json();
    return NextResponse.json(jobs);
    
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';

const CAPTURE_SERVICE_URL = process.env.CAPTURE_SERVICE_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    
    // Forward request to capture service
    const response = await fetch(`${CAPTURE_SERVICE_URL}/api/capture/${jobId}`);
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    const job = await response.json();
    return NextResponse.json(job);
    
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}
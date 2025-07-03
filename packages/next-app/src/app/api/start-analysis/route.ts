import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysisData, captureJobId } = body;

    // Validate required data
    if (!analysisData || !captureJobId) {
      return NextResponse.json(
        { error: 'Missing required analysis data or capture job ID' },
        { status: 400 }
      );
    }

    // Forward request to analysis service
    const analysisServiceUrl = process.env.ANALYSIS_SERVICE_URL || 'http://localhost:3002';
    
    const response = await fetch(`${analysisServiceUrl}/api/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysisData,
        captureJobId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Analysis service error: ${errorText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      analysisJobId: result.jobId,
      status: result.status
    });

  } catch (error) {
    console.error('Failed to start analysis:', error);
    return NextResponse.json(
      { error: `Failed to start analysis: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID is required' },
      { status: 400 }
    );
  }

  try {
    // Forward request to analysis service
    const analysisServiceUrl = process.env.ANALYSIS_SERVICE_URL || 'http://localhost:3002';
    
    const response = await fetch(`${analysisServiceUrl}/api/analysis/${jobId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      throw new Error(`Analysis service error: ${response.statusText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Failed to get analysis status:', error);
    return NextResponse.json(
      { error: `Failed to get analysis status: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
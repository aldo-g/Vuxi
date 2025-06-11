import { NextRequest, NextResponse } from 'next/server';

const CAPTURE_SERVICE_URL = process.env.CAPTURE_SERVICE_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const { websiteUrl, anonymous = false } = await request.json();
    
    if (!websiteUrl) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch {
      return NextResponse.json(
        { error: 'Please provide a valid URL (e.g., https://example.com)' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting analysis for: ${websiteUrl} (anonymous: ${anonymous})`);

    // Forward request to capture service
    const response = await fetch(`${CAPTURE_SERVICE_URL}/api/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        baseUrl: websiteUrl,
        options: {
          maxPages: anonymous ? 10 : 20, // Limit pages for anonymous users
          timeout: 8000,
          concurrency: 3,
          fastMode: true,
        }
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Capture service error:', error);
      return NextResponse.json(
        { error: error.error || 'Failed to start analysis' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    console.log(`✅ Analysis job created: ${result.jobId}`);
    
    return NextResponse.json({
      success: true,
      analysisId: result.jobId,
      message: 'Analysis started successfully',
      websiteUrl,
      anonymous
    });
    
  } catch (error) {
    console.error('Error starting analysis:', error);
    return NextResponse.json(
      { error: 'Failed to start website analysis' },
      { status: 500 }
    );
  }
}
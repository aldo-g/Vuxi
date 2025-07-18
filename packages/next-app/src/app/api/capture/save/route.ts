import { NextRequest, NextResponse } from 'next/server';
import { CaptureService } from '@/lib/capture-service';
import { SaveCaptureRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: SaveCaptureRequest = await request.json();
    
    // Validate required fields
    if (!body.analysisData || !body.captureJobId) {
      return NextResponse.json(
        { error: 'Missing required fields: analysisData and captureJobId' },
        { status: 400 }
      );
    }

    if (!body.analysisData.userId) {
      return NextResponse.json(
        { error: 'User ID is required in analysisData' },
        { status: 400 }
      );
    }

    // Save to database
    const result = await CaptureService.saveCaptureData(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save capture data' },
        { status: 500 }
      );
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('API Error saving capture data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { CaptureService } from '@/lib/capture-service';
import { SaveCaptureRequest } from '@/types';

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/start-analysis called');
  
  try {
    const body = await request.json();
    console.log('📊 Request body received:', {
      hasAnalysisData: !!body.analysisData,
      hasCaptureJobId: !!body.captureJobId,
      websiteUrl: body.analysisData?.websiteUrl,
      userId: body.analysisData?.userId,
      screenshotCount: body.analysisData?.screenshots?.length || 0
    });

    const { analysisData, captureJobId } = body;
    
    if (!analysisData || !captureJobId) {
      console.error('❌ Missing required fields:', {
        hasAnalysisData: !!analysisData,
        hasCaptureJobId: !!captureJobId
      });
      return NextResponse.json({ 
        error: 'Missing analysis data or capture job ID' 
      }, { status: 400 });
    }

    if (!analysisData.userId) {
      console.error('❌ Missing userId in analysisData');
      return NextResponse.json({ 
        error: 'User ID is required in analysis data' 
      }, { status: 400 });
    }

    console.log(`🔍 Starting database save for ${analysisData.organizationName}`);

    // ONLY SAVE TO DATABASE - NO EXTERNAL ANALYSIS SERVICE
    const saveRequest: SaveCaptureRequest = {
      analysisData,
      captureJobId
    };

    const saveResult = await CaptureService.saveCaptureData(saveRequest);
    
    if (!saveResult.success) {
      console.error('❌ Failed to save capture data:', saveResult.error);
      return NextResponse.json({ 
        error: `Failed to save capture data: ${saveResult.error}` 
      }, { status: 500 });
    }

    console.log(`✅ SUCCESS! Data saved to database:`, {
      projectId: saveResult.projectId,
      analysisRunId: saveResult.analysisRunId,
      pages: saveResult.analyzedPageIds.length,
      screenshots: saveResult.screenshotIds.length
    });

    // Return success response (skip external analysis service)
    return NextResponse.json({
      success: true,
      message: 'Data saved to database successfully',
      analysisJobId: `db_save_${saveResult.analysisRunId}`, // Fake analysis job ID
      status: 'completed', // Mark as completed since we're not doing analysis
      analysisRunId: saveResult.analysisRunId,
      projectId: saveResult.projectId,
      // Mock some analysis result
      results: {
        reportData: {
          message: 'Data saved successfully! External analysis service is disabled.',
          savedData: {
            projectId: saveResult.projectId,
            analysisRunId: saveResult.analysisRunId,
            pagesAnalyzed: saveResult.analyzedPageIds.length,
            screenshotsSaved: saveResult.screenshotIds.length
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ FATAL ERROR in /api/start-analysis:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: `Server error: ${error.message}` 
    }, { status: 500 });
  }
}

// Keep the GET method for polling (though it won't be needed now)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  console.log('📊 GET /api/start-analysis called with jobId:', jobId);

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }

  // Since we're not using external service, just return completed status
  return NextResponse.json({
    id: jobId,
    status: 'completed',
    progress: { stage: 'completed', percentage: 100, message: 'Database save completed' },
    results: {
      reportData: {
        message: 'Data was saved to database successfully!'
      }
    }
  });
}
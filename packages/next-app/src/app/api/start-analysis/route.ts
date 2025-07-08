import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for analysis jobs
const analysisJobs = new Map();

export async function POST(request: NextRequest) {
  try {
    const { analysisData, captureJobId } = await request.json();
    
    if (!analysisData || !captureJobId) {
      return NextResponse.json({ error: 'Missing analysis data or capture job ID' }, { status: 400 });
    }

    console.log(`🚀 Starting analysis for ${analysisData.organizationName}`);

    // Call the analysis server to start the job
    const response = await fetch('http://localhost:3002/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysisData,
        captureJobId
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Analysis server responded with ${response.status}: ${errorData}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to start analysis');
    }

    // Store job mapping in Next.js
    const analysisJobId = `nextjs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    analysisJobs.set(analysisJobId, {
      id: analysisJobId,
      analysisServerJobId: result.jobId, // Store the actual analysis server job ID
      status: 'pending',
      progress: { stage: 'starting', percentage: 0, message: 'Starting analysis...' },
      createdAt: new Date().toISOString()
    });

    console.log(`✅ Analysis job created: ${analysisJobId} -> ${result.jobId}`);

    return NextResponse.json({
      analysisJobId,
      status: 'pending'
    });

  } catch (error) {
    console.error('❌ Error starting analysis:', error);
    return NextResponse.json({ error: 'Failed to start analysis' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }

  const job = analysisJobs.get(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  try {
    // Get the latest status from the analysis server
    const response = await fetch(`http://localhost:3002/api/analysis/${job.analysisServerJobId}`);
    
    if (!response.ok) {
      throw new Error(`Analysis server responded with ${response.status}`);
    }

    const serverJobData = await response.json();
    
    console.log(`📊 Analysis job ${jobId} status:`, {
      status: serverJobData.status,
      stage: serverJobData.progress?.stage,
      percentage: serverJobData.progress?.percentage,
      hasResults: !!serverJobData.results,
      hasReportData: !!serverJobData.results?.reportData
    });

    // Update our local job with server data
    const updatedJob = {
      ...job,
      status: serverJobData.status,
      progress: serverJobData.progress,
      results: serverJobData.results,
      error: serverJobData.error,
      updatedAt: new Date().toISOString()
    };

    analysisJobs.set(jobId, updatedJob);

    return NextResponse.json(updatedJob);

  } catch (error) {
    console.error(`❌ Error fetching analysis status for job ${jobId}:`, error);
    
    // Return last known status with error
    const errorJob = {
      ...job,
      status: 'failed',
      error: 'Failed to get status from analysis server',
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(errorJob);
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// In-memory storage for analysis jobs
const analysisJobs = new Map();

export async function POST(request: NextRequest) {
  try {
    const { analysisData, captureJobId } = await request.json();
    
    if (!analysisData || !captureJobId) {
      return NextResponse.json({ error: 'Missing analysis data or capture job ID' }, { status: 400 });
    }

    // Generate a unique analysis job ID
    const analysisJobId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🚀 Starting analysis job ${analysisJobId} for ${analysisData.organizationName}`);
    
    // Store initial job status
    analysisJobs.set(analysisJobId, {
      id: analysisJobId,
      status: 'pending',
      progress: { stage: 'starting', percentage: 0, message: 'Starting analysis...' },
      createdAt: new Date().toISOString()
    });

    // Start analysis in background using child process
    runAnalysisAsService(analysisJobId, analysisData, captureJobId);

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

  return NextResponse.json(job);
}

async function runAnalysisAsService(jobId: string, analysisData: any, captureJobId: string) {
  try {
    console.log(`🔬 Running analysis as service for job ${jobId}`);
    
    // Update job status
    analysisJobs.set(jobId, {
      id: jobId,
      status: 'running',
      progress: { stage: 'analyzing', percentage: 20, message: 'Running LLM analysis...' }
    });

    // Prepare analysis input
    const analysisInput = {
      urls: analysisData.screenshots?.map((s: any) => s.url) || [],
      organizationName: analysisData.organizationName,
      organizationType: 'organization',
      organizationPurpose: analysisData.sitePurpose
    };

    console.log(`📊 Analysis input for job ${jobId}:`, analysisInput);

    // Update progress
    analysisJobs.set(jobId, {
      id: jobId,
      status: 'running',
      progress: { stage: 'lighthouse', percentage: 40, message: 'Running Lighthouse audits...' }
    });

    // Call analysis service
    const result = await callAnalysisService(analysisInput);

    console.log(`📋 Analysis result for job ${jobId}:`, {
      success: result.success,
      hasReportData: !!result.reportData,
      error: result.error
    });

    if (result.success) {
      // Update job with completion and report data
      analysisJobs.set(jobId, {
        id: jobId,
        status: 'completed',
        progress: { stage: 'completed', percentage: 100, message: 'Analysis completed successfully!' },
        results: {
          lighthouse: result.lighthouse,
          llmAnalysis: result.llmAnalysis,
          formatting: result.formatting,
          htmlReport: result.htmlReport,
          reportData: result.reportData
        }
      });

      console.log(`✅ Analysis job ${jobId} completed successfully with report data`);
    } else {
      // Update job with failure
      analysisJobs.set(jobId, {
        id: jobId,
        status: 'failed',
        progress: { stage: 'failed', percentage: 0, message: 'Analysis failed' },
        error: result.error || 'Analysis failed'
      });

      console.error(`❌ Analysis job ${jobId} failed:`, result.error);
    }

  } catch (error) {
    console.error(`💥 Analysis job ${jobId} error:`, error);
    
    // Update job with error
    analysisJobs.set(jobId, {
      id: jobId,
      status: 'failed',
      progress: { stage: 'failed', percentage: 0, message: 'Analysis failed due to error' },
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function callAnalysisService(analysisInput: any): Promise<any> {
  return new Promise((resolve, reject) => {
    // Path to the analysis service script
    const analysisScriptPath = path.resolve(process.cwd(), '../analysis/service.js');
    
    console.log(`🔧 Calling analysis service at: ${analysisScriptPath}`);
    
    // Spawn child process to run analysis
    const child = spawn('node', [analysisScriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.resolve(process.cwd(), '../analysis')
    });

    // Send input data to child process
    child.stdin.write(JSON.stringify(analysisInput));
    child.stdin.end();

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('Analysis service error:', data.toString());
    });

    child.on('close', (code) => {
      console.log(`🏁 Analysis service finished with code: ${code}`);
      
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (parseError) {
          console.error('Failed to parse analysis result:', parseError);
          reject(new Error('Failed to parse analysis result'));
        }
      } else {
        reject(new Error(`Analysis service failed with code ${code}: ${errorOutput}`));
      }
    });

    child.on('error', (error) => {
      console.error('Failed to start analysis service:', error);
      reject(error);
    });
  });
}
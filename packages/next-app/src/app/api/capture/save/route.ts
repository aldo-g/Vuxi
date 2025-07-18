import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/database';
import * as jose from 'jose';
import type { SaveCaptureRequest, SaveCaptureResponse } from '@/types';

async function getUserFromToken(request: NextRequest): Promise<number | null> {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    
    return payload.userId as number;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from token
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SaveCaptureRequest = await request.json();
    const { analysisData, captureJobId } = body;

    // Validate required fields
    if (!analysisData.websiteUrl || !analysisData.organizationName || !captureJobId) {
      return NextResponse.json({ 
        error: 'Missing required fields: websiteUrl, organizationName, captureJobId' 
      }, { status: 400 });
    }

    // Start database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or find project
      let project = await tx.project.findFirst({
        where: {
          userId: userId,
          baseUrl: analysisData.websiteUrl,
        }
      });

      if (!project) {
        project = await tx.project.create({
          data: {
            userId: userId,
            name: analysisData.organizationName,
            baseUrl: analysisData.websiteUrl,
            orgName: analysisData.organizationName,
            orgPurpose: analysisData.sitePurpose,
          }
        });
      } else {
        // Update project details if they've changed
        project = await tx.project.update({
          where: { id: project.id },
          data: {
            orgName: analysisData.organizationName,
            orgPurpose: analysisData.sitePurpose,
          }
        });
      }

      // 2. Create analysis run
      const analysisRun = await tx.analysisRun.create({
        data: {
          projectId: project.id,
          status: 'completed',
          progress: {
            stage: 'screenshot_capture_complete',
            percentage: 100,
            message: `Captured ${analysisData.screenshots?.filter(s => s.success).length || 0} screenshots`
          }
        }
      });

      // 3. Create analyzed pages and screenshots
      if (analysisData.screenshots) {
        for (const screenshot of analysisData.screenshots) {
          if (screenshot.success && screenshot.data) {
            // Create analyzed page
            const analyzedPage = await tx.analyzedPage.create({
              data: {
                runId: analysisRun.id,
                url: screenshot.url,
                pageAim: null, // Will be filled during analysis
              }
            });

            // Create screenshot record
            await tx.screenshot.create({
              data: {
                analyzedPageId: analyzedPage.id,
                storageUrl: screenshot.data.path || screenshot.data.filename || '',
                viewport: screenshot.data.viewport ? 
                  `${screenshot.data.viewport.width}x${screenshot.data.viewport.height}` : 
                  'desktop',
                label: 'Initial Load',
              }
            });
          }
        }
      }

      return {
        projectId: project.id,
        analysisRunId: analysisRun.id
      };
    });

    const response: SaveCaptureResponse = {
      success: true,
      projectId: result.projectId,
      analysisRunId: result.analysisRunId
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error saving capture data:', error);
    return NextResponse.json({ 
      error: 'Failed to save capture data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
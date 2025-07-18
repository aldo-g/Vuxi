import { database } from '@/lib';
import { AnalysisData, SaveCaptureRequest, SaveCaptureResponse } from '@/types';

export class CaptureService {
  /**
   * Save capture data to database
   */
  static async saveCaptureData(request: SaveCaptureRequest): Promise<SaveCaptureResponse> {
    console.log('🔍 CaptureService.saveCaptureData called with:', {
      hasAnalysisData: !!request.analysisData,
      captureJobId: request.captureJobId,
      websiteUrl: request.analysisData?.websiteUrl,
      userId: request.analysisData?.userId,
      screenshotCount: request.analysisData?.screenshots?.length || 0
    });

    try {
      const { analysisData, captureJobId } = request;
      const { websiteUrl, organizationName, sitePurpose, userId, screenshots = [] } = analysisData;

      console.log('📊 Extracted data:', {
        websiteUrl,
        organizationName,
        sitePurpose,
        userId,
        captureJobId,
        screenshotCount: screenshots.length
      });

      if (!userId) {
        console.error('❌ No userId provided');
        throw new Error('User ID is required');
      }

      if (!websiteUrl) {
        console.error('❌ No websiteUrl provided');
        throw new Error('Website URL is required');
      }

      if (!captureJobId) {
        console.error('❌ No captureJobId provided');
        throw new Error('Capture Job ID is required');
      }

      console.log('🚀 Starting database transaction...');

      // Start a transaction to ensure data consistency
      const result = await database.$transaction(async (tx) => {
        console.log('📋 Transaction started, upserting project...');

        // 1. Create or find existing project
        const project = await tx.project.upsert({
          where: {
            userId_baseUrl: {
              userId: userId,
              baseUrl: websiteUrl
            }
          },
          update: {
            orgName: organizationName,
            orgPurpose: sitePurpose,
          },
          create: {
            userId: userId,
            name: organizationName || `Project for ${websiteUrl}`,
            baseUrl: websiteUrl,
            orgName: organizationName,
            orgPurpose: sitePurpose,
          }
        });

        console.log('✅ Project upserted:', {
          id: project.id,
          name: project.name,
          baseUrl: project.baseUrl
        });

        // 2. Create analysis run
        console.log('📋 Creating analysis run...');
        const analysisRun = await tx.analysisRun.create({
          data: {
            projectId: project.id,
            captureJobId: captureJobId,
            status: 'pending',
            progress: {
              stage: 'capture_completed',
              percentage: 20,
              message: 'Screenshots captured successfully'
            }
          }
        });

        console.log('✅ Analysis run created:', {
          id: analysisRun.id,
          projectId: analysisRun.projectId,
          captureJobId: analysisRun.captureJobId
        });

        // 3. Process screenshots and create analyzed pages
        console.log(`📸 Processing ${screenshots.length} screenshots...`);
        const analyzedPageIds: number[] = [];
        const screenshotIds: number[] = [];

        for (let i = 0; i < screenshots.length; i++) {
          const screenshot = screenshots[i];
          console.log(`📸 Processing screenshot ${i + 1}/${screenshots.length}:`, {
            url: screenshot.url,
            success: screenshot.success,
            hasData: !!screenshot.data
          });

          if (!screenshot.success || !screenshot.data) {
            console.log(`⚠️ Skipping failed screenshot for ${screenshot.url}`);
            continue; // Skip failed screenshots
          }

          // Create analyzed page for this URL
          const analyzedPage = await tx.analyzedPage.create({
            data: {
              runId: analysisRun.id,
              url: screenshot.url,
              pageAim: `Analysis of ${screenshot.url}`,
            }
          });
          analyzedPageIds.push(analyzedPage.id);

          console.log(`✅ Created analyzed page ${analyzedPage.id} for ${screenshot.url}`);

          // Create screenshot record
          const screenshotRecord = await tx.screenshot.create({
            data: {
              analyzedPageId: analyzedPage.id,
              url: screenshot.url,
              filename: screenshot.data.filename || null,
              storageUrl: screenshot.data.path || screenshot.data.filename || '',
              success: screenshot.success,
              viewport: screenshot.data.viewport 
                ? `${screenshot.data.viewport.width}x${screenshot.data.viewport.height}` 
                : 'desktop',
              duration_ms: screenshot.data.duration_ms || null,
              timestamp: screenshot.data.timestamp ? new Date(screenshot.data.timestamp) : null,
              error: screenshot.error || null,
            }
          });
          screenshotIds.push(screenshotRecord.id);

          console.log(`✅ Created screenshot record ${screenshotRecord.id}`);
        }

        console.log('🎉 Transaction completed successfully!');
        return {
          projectId: project.id,
          analysisRunId: analysisRun.id,
          analyzedPageIds,
          screenshotIds,
        };
      });

      console.log('🎉 FINAL SUCCESS:', result);
      return {
        success: true,
        ...result
      };

    } catch (error) {
      console.error('❌ FATAL ERROR in CaptureService.saveCaptureData:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return {
        success: false,
        projectId: 0,
        analysisRunId: 0,
        analyzedPageIds: [],
        screenshotIds: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
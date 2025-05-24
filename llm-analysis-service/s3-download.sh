#!/bin/bash
# s3-download.sh - Downloads screenshots and lighthouse data from S3

# Check if environment is AWS
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Running in AWS environment, downloading from S3..."
  
  # Create directories
  mkdir -p /app/data/screenshots/desktop
  mkdir -p /app/data/lighthouse/trimmed
  
  # Get job ID from environment variable or find the most recent one
  if [ -z "$JOB_ID" ]; then
    echo "🔍 No JOB_ID provided, looking for the most recent job..."
    
    # Get the most recent job based on the last modified time
    LATEST_JOB=$(aws s3 ls s3://${S3_BUCKET:-website-analyzer-data}/jobs/ --recursive | grep "lighthouse-summary.json" | sort -k1,2 | tail -n1 | awk '{print $4}' | cut -d'/' -f2)
    
    if [ -z "$LATEST_JOB" ]; then
      echo "❌ No completed jobs found"
      exit 1
    fi
    
    JOB_ID="$LATEST_JOB"
    echo "📋 Found latest job: $JOB_ID"
  else
    echo "📋 Using provided JOB_ID: $JOB_ID"
  fi
  
  # S3 paths
  S3_SCREENSHOTS_PATH="s3://${S3_BUCKET:-website-analyzer-data}/jobs/${JOB_ID}/screenshots/"
  S3_LIGHTHOUSE_PATH="s3://${S3_BUCKET:-website-analyzer-data}/jobs/${JOB_ID}/lighthouse/"
  
  # Download screenshots
  echo "📥 Downloading screenshots from $S3_SCREENSHOTS_PATH"
  if aws s3 cp "${S3_SCREENSHOTS_PATH}" /app/data/screenshots/desktop/ --recursive --exclude "metadata.json"; then
    echo "✅ Successfully downloaded screenshots"
    SCREENSHOT_COUNT=$(ls -1 /app/data/screenshots/desktop/*.png 2>/dev/null | wc -l)
    echo "📸 Downloaded $SCREENSHOT_COUNT screenshots"
  else
    echo "❌ Failed to download screenshots"
    exit 1
  fi
  
  # Download lighthouse trimmed data
  echo "📥 Downloading lighthouse data from ${S3_LIGHTHOUSE_PATH}trimmed/"
  if aws s3 cp "${S3_LIGHTHOUSE_PATH}trimmed/" /app/data/lighthouse/trimmed/ --recursive; then
    echo "✅ Successfully downloaded lighthouse data"
    LIGHTHOUSE_COUNT=$(ls -1 /app/data/lighthouse/trimmed/*.json 2>/dev/null | wc -l)
    echo "🚦 Downloaded $LIGHTHOUSE_COUNT lighthouse reports"
  else
    echo "❌ Failed to download lighthouse data"
    exit 1
  fi
  
  # Verify we have data to work with
  if [ $SCREENSHOT_COUNT -eq 0 ] && [ $LIGHTHOUSE_COUNT -eq 0 ]; then
    echo "❌ No data available for analysis"
    exit 1
  fi
  
  echo "✅ Prerequisites downloaded successfully"
  
else
  echo "🖥️ Running in local environment, skipping S3 download"
fi
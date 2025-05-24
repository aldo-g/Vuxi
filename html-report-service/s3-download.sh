#!/bin/bash
# s3-download.sh - Downloads analysis and screenshots from S3

# Check if environment is AWS
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Running in AWS environment, downloading from S3..."
  
  # Create directories
  mkdir -p /app/data/analysis
  mkdir -p /app/data/screenshots/desktop
  
  # Get job ID from environment variable or find the most recent one
  if [ -z "$JOB_ID" ]; then
    echo "🔍 No JOB_ID provided, looking for the most recent job..."
    
    # Get the most recent job based on structured analysis completion
    LATEST_JOB=$(aws s3 ls s3://${S3_BUCKET:-website-analyzer-data}/jobs/ --recursive | grep "structured-analysis.json" | sort -k1,2 | tail -n1 | awk '{print $4}' | cut -d'/' -f2)
    
    if [ -z "$LATEST_JOB" ]; then
      echo "❌ No completed structured analysis jobs found, trying regular analysis..."
      # Fallback to regular analysis.json
      LATEST_JOB=$(aws s3 ls s3://${S3_BUCKET:-website-analyzer-data}/jobs/ --recursive | grep "analysis.json" | sort -k1,2 | tail -n1 | awk '{print $4}' | cut -d'/' -f2)
      
      if [ -z "$LATEST_JOB" ]; then
        echo "❌ No analysis jobs found at all"
        exit 1
      fi
    fi
    
    JOB_ID="$LATEST_JOB"
    echo "📋 Found latest job: $JOB_ID"
  else
    echo "📋 Using provided JOB_ID: $JOB_ID"
  fi
  
  # S3 paths
  S3_ANALYSIS_PATH="s3://${S3_BUCKET:-website-analyzer-data}/jobs/${JOB_ID}/analysis/"
  S3_SCREENSHOTS_PATH="s3://${S3_BUCKET:-website-analyzer-data}/jobs/${JOB_ID}/screenshots/"
  
  # Download structured analysis (preferred) or fallback to regular analysis
  echo "📥 Downloading analysis from $S3_ANALYSIS_PATH"
  if aws s3 cp "${S3_ANALYSIS_PATH}structured-analysis.json" /app/data/analysis/structured-analysis.json; then
    echo "✅ Successfully downloaded structured-analysis.json"
  elif aws s3 cp "${S3_ANALYSIS_PATH}analysis.json" /app/data/analysis/analysis.json; then
    echo "✅ Downloaded analysis.json, copying as structured-analysis.json"
    cp /app/data/analysis/analysis.json /app/data/analysis/structured-analysis.json
  else
    echo "❌ Failed to download any analysis files"
    exit 1
  fi
  
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
  
  # Verify we have data to work with
  if [ ! -f "/app/data/analysis/structured-analysis.json" ]; then
    echo "❌ No analysis data available for report generation"
    exit 1
  fi
  
  echo "✅ Prerequisites downloaded successfully"
  
else
  echo "🖥️ Running in local environment, skipping S3 download"
fi
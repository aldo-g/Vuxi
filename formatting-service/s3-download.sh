#!/bin/bash
# s3-download.sh - Downloads raw analysis from S3

# Check if environment is AWS
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Running in AWS environment, downloading from S3..."
  
  # Create directories
  mkdir -p /app/data/analysis
  
  # Get job ID from environment variable or find the most recent one
  if [ -z "$JOB_ID" ]; then
    echo "🔍 No JOB_ID provided, looking for the most recent job..."
    
    # Get the most recent job based on analysis completion
    LATEST_JOB=$(aws s3 ls s3://${S3_BUCKET:-website-analyzer-data}/jobs/ --recursive | grep "analysis.json" | sort -k1,2 | tail -n1 | awk '{print $4}' | cut -d'/' -f2)
    
    if [ -z "$LATEST_JOB" ]; then
      echo "❌ No completed analysis jobs found"
      exit 1
    fi
    
    JOB_ID="$LATEST_JOB"
    echo "📋 Found latest job: $JOB_ID"
  else
    echo "📋 Using provided JOB_ID: $JOB_ID"
  fi
  
  # S3 path for analysis
  S3_ANALYSIS_PATH="s3://${S3_BUCKET:-website-analyzer-data}/jobs/${JOB_ID}/analysis/"
  
  # Download raw analysis
  echo "📥 Downloading raw analysis from $S3_ANALYSIS_PATH"
  if aws s3 cp "${S3_ANALYSIS_PATH}analysis.json" /app/data/analysis/analysis.json; then
    echo "✅ Successfully downloaded raw analysis"
    
    # Check file size to ensure it's not empty
    FILESIZE=$(stat -f%z /app/data/analysis/analysis.json 2>/dev/null || stat -c%s /app/data/analysis/analysis.json 2>/dev/null || echo 0)
    if [ "$FILESIZE" -gt 100 ]; then
      echo "📊 Analysis file size: ${FILESIZE} bytes"
    else
      echo "❌ Analysis file appears to be empty or too small"
      exit 1
    fi
  else
    echo "❌ Failed to download analysis"
    exit 1
  fi
  
  echo "✅ Prerequisites downloaded successfully"
  
else
  echo "🖥️ Running in local environment, skipping S3 download"
fi
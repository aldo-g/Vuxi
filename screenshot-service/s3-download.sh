#!/bin/bash
# s3-download.sh - Downloads URL list from S3

# Check if environment is AWS
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Running in AWS environment, downloading from S3..."
  
  # Create directories
  mkdir -p /app/data
  
  # Get job ID from environment variable or use previous job
  JOB_ID=${JOB_ID:-$(aws s3 ls s3://${S3_BUCKET:-website-analyzer-data}/jobs/ | sort | tail -n 1 | awk '{print $2}' | tr -d /)}
  
  if [ -z "$JOB_ID" ]; then
    echo "❌ No job ID provided and couldn't find previous jobs"
    exit 1
  fi
  
  # S3 path for URLs
  S3_URLS_PATH="s3://${S3_BUCKET:-website-analyzer-data}/jobs/${JOB_ID}/urls/urls_simple.json"
  
  # Download the URL list
  echo "📥 Downloading URLs from $S3_URLS_PATH"
  if aws s3 cp "$S3_URLS_PATH" /app/data/urls_simple.json; then
    echo "✅ Successfully downloaded URLs"
  else
    echo "❌ Failed to download URLs, checking for urls.json instead"
    
    # Try downloading the full URL file instead
    S3_URLS_FULL_PATH="s3://${S3_BUCKET:-website-analyzer-data}/jobs/${JOB_ID}/urls/urls.json"
    if aws s3 cp "$S3_URLS_FULL_PATH" /app/data/urls.json; then
      echo "✅ Downloaded full URLs file, extracting simple list"
      # Extract the URL array to create urls_simple.json
      cat /app/data/urls.json | jq -r '.urls' > /app/data/urls_simple.json
    else
      echo "❌ Failed to download URLs"
      exit 1
    fi
  fi
else
  echo "🖥️ Running in local environment, skipping S3 download"
fi
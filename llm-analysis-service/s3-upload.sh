#!/bin/bash
# s3-upload.sh - Uploads analysis results to S3

# Check if environment is AWS
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Running in AWS environment, uploading to S3..."
  
  # Check if the directory exists
  if [ -d "$1" ]; then
    # Use JOB_ID from environment or create timestamp-based one
    JOB_ID=${JOB_ID:-$(date +%Y%m%d%H%M%S)}
    S3_PATH="s3://${S3_BUCKET:-website-analyzer-data}/jobs/${JOB_ID}/analysis/"
    
    echo "📤 Uploading to JOB_ID: $JOB_ID"
    
    # Upload analysis results to S3
    echo "📤 Uploading analysis results from $1 to $S3_PATH"
    aws s3 cp "$1" "$S3_PATH" --recursive
    
    # Check if upload was successful
    if [ $? -eq 0 ]; then
      echo "✅ Successfully uploaded analysis results to S3"
      
      # List uploaded files
      echo "📄 Uploaded files:"
      aws s3 ls "$S3_PATH" --recursive
    else
      echo "❌ Failed to upload analysis results to S3"
      exit 1
    fi
  else
    echo "❌ Directory $1 does not exist"
    exit 1
  fi
else
  echo "🖥️ Running in local environment, skipping S3 upload"
fi
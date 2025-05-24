#!/bin/bash
# s3-upload.sh - Uploads structured analysis to S3

# Check if environment is AWS
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Running in AWS environment, uploading to S3..."
  
  # Check if the file exists
  if [ -f "$1" ]; then
    # Use JOB_ID from environment or create timestamp-based one
    JOB_ID=${JOB_ID:-$(date +%Y%m%d%H%M%S)}
    S3_PATH="s3://${S3_BUCKET:-website-analyzer-data}/jobs/${JOB_ID}/analysis/"
    
    echo "📤 Uploading to JOB_ID: $JOB_ID"
    
    # Upload structured analysis to S3
    echo "📤 Uploading structured analysis from $1 to ${S3_PATH}structured-analysis.json"
    aws s3 cp "$1" "${S3_PATH}structured-analysis.json"
    
    # Check if upload was successful
    if [ $? -eq 0 ]; then
      echo "✅ Successfully uploaded structured analysis to S3"
      
      # Verify the upload
      aws s3 ls "${S3_PATH}structured-analysis.json"
    else
      echo "❌ Failed to upload structured analysis to S3"
      exit 1
    fi
  else
    echo "❌ File $1 does not exist"
    exit 1
  fi
else
  echo "🖥️ Running in local environment, skipping S3 upload"
fi
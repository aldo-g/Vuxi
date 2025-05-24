#!/bin/bash
# s3-upload.sh - Uploads HTML reports to S3

# Check if environment is AWS
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Running in AWS environment, uploading to S3..."
  
  # Check if the directory exists
  if [ -d "$1" ]; then
    # Use JOB_ID from environment or create timestamp-based one
    JOB_ID=${JOB_ID:-$(date +%Y%m%d%H%M%S)}
    S3_PATH="s3://${S3_BUCKET:-website-analyzer-data}/jobs/${JOB_ID}/reports/"
    
    echo "📤 Uploading to JOB_ID: $JOB_ID"
    
    # Upload HTML reports to S3
    echo "📤 Uploading HTML reports from $1 to $S3_PATH"
    aws s3 cp "$1" "$S3_PATH" --recursive
    
    # Check if upload was successful
    if [ $? -eq 0 ]; then
      echo "✅ Successfully uploaded HTML reports to S3"
      
      # List uploaded files
      echo "📄 Uploaded files:"
      aws s3 ls "$S3_PATH" --recursive
      
      # Generate public URL for the main report (if S3 bucket is public)
      MAIN_REPORT_URL="https://${S3_BUCKET:-website-analyzer-data}.s3.${AWS_REGION:-eu-west-1}.amazonaws.com/jobs/${JOB_ID}/reports/index.html"
      echo "🌐 Main report will be available at: $MAIN_REPORT_URL"
      echo "   (Note: URL will only work if S3 bucket has public read access)"
      
    else
      echo "❌ Failed to upload HTML reports to S3"
      exit 1
    fi
  else
    echo "❌ Directory $1 does not exist"
    exit 1
  fi
else
  echo "🖥️ Running in local environment, skipping S3 upload"
fi
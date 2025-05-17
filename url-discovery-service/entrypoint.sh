#!/bin/bash
set -e

# Define the output path
OUTPUT_DIR="/app/data"

# Check if data directory exists and clean up old files
if [ -d "$OUTPUT_DIR" ]; then
  echo "🧹 Cleaning up previous URL discovery results..."
  rm -f $OUTPUT_DIR/urls.json $OUTPUT_DIR/urls_simple.json
  echo "✅ Cleanup complete"
fi

# Make sure the directory exists
mkdir -p $OUTPUT_DIR

# Download from S3 if in AWS environment
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Checking for existing data in S3..."
  # Add download code if needed
fi

# Run the command (without exec to allow for subsequent steps)
"$@"

# Upload results to S3 if in AWS environment
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Uploading results to S3..."
  /app/s3-upload.sh "$OUTPUT_DIR/urls.json"
  
  # Also upload the simple URLs file
  S3_BUCKET=${S3_BUCKET:-website-analyzer-data}
  JOB_ID=${JOB_ID:-$(date +%Y%m%d%H%M%S)}
  S3_PATH="s3://$S3_BUCKET/jobs/$JOB_ID/urls/"
  
  if [ -f "$OUTPUT_DIR/urls_simple.json" ]; then
    echo "📤 Uploading urls_simple.json to $S3_PATH"
    aws s3 cp "$OUTPUT_DIR/urls_simple.json" "${S3_PATH}urls_simple.json"
  fi
fi
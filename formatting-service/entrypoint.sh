#!/bin/bash
set -e

# Define the output path for the structured analysis JSON
OUTPUT_FILE="/app/data/analysis/structured-analysis.json"

# Check if file exists and clean up
if [ -f "$OUTPUT_FILE" ]; then
  echo "🧹 Cleaning up previous formatting results..."
  rm -f "$OUTPUT_FILE"
  echo "✅ Cleanup complete"
fi

# Make sure the directory exists
mkdir -p "/app/data/analysis"

# Download prerequisites from S3 if in AWS environment
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Downloading analysis data from S3..."
  /app/s3-download.sh
fi

# Run the command (without exec to allow for subsequent steps)
"$@"

# Upload results to S3 if in AWS environment
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Uploading structured analysis to S3..."
  /app/s3-upload.sh "$OUTPUT_FILE"
fi
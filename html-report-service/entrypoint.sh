#!/bin/bash
set -e

# Define the output path - adjust if your command uses a different path
OUTPUT_DIR="/app/data/reports"

# Check if reports directory exists and clean up only HTML report files
if [ -d "$OUTPUT_DIR" ]; then
  echo "🧹 Cleaning up previous HTML reports..."
  rm -f $OUTPUT_DIR/*.html $OUTPUT_DIR/*.txt
  rm -f $OUTPUT_DIR/pages/*.html
  rm -f $OUTPUT_DIR/screenshots/desktop/*.png
  echo "✅ Cleanup complete"
fi

# Make sure the directory structure exists
mkdir -p $OUTPUT_DIR/pages
mkdir -p $OUTPUT_DIR/screenshots/desktop

# Download prerequisites from S3 if in AWS environment
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Downloading analysis and screenshots from S3..."
  /app/s3-download.sh
fi

# Run the command (without exec to allow for subsequent steps)
"$@"

# Upload results to S3 if in AWS environment
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Uploading HTML reports to S3..."
  /app/s3-upload.sh "$OUTPUT_DIR"
fi
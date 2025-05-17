#!/bin/bash
set -e

# Define the output path
OUTPUT_DIR="/app/data/lighthouse"

# Check if lighthouse directory exists and clean up old files
if [ -d "$OUTPUT_DIR" ]; then
  echo "🧹 Cleaning up previous Lighthouse results..."
  rm -f $OUTPUT_DIR/lighthouse-summary.json
  rm -rf $OUTPUT_DIR/reports
  rm -rf $OUTPUT_DIR/trimmed
  echo "✅ Cleanup complete"
fi

# Make sure the directory structure exists
mkdir -p $OUTPUT_DIR/reports
mkdir -p $OUTPUT_DIR/trimmed

# Download from S3 if in AWS environment
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Downloading data from S3..."
  /app/s3-download.sh
fi

# Run the command (without exec to allow for subsequent steps)
"$@"

# Upload results to S3 if in AWS environment
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Uploading results to S3..."
  /app/s3-upload.sh "$OUTPUT_DIR"
fi
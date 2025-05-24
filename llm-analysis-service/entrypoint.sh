#!/bin/bash
set -e

# Define the output path
OUTPUT_DIR="/app/data/analysis"

# Check if analysis directory exists and clean up analysis files
if [ -d "$OUTPUT_DIR" ]; then
  echo "🧹 Cleaning up previous analysis results..."
  rm -f $OUTPUT_DIR/analysis.json $OUTPUT_DIR/analysis-metadata.json
  echo "✅ Cleanup complete"
fi

# Make sure the directory exists
mkdir -p $OUTPUT_DIR

# Download prerequisites from S3 if in AWS environment
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Downloading screenshots and lighthouse data from S3..."
  /app/s3-download.sh
fi

# Execute the command passed to docker run
"$@"

# Upload results to S3 if in AWS environment
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Uploading analysis results to S3..."
  /app/s3-upload.sh "$OUTPUT_DIR"
fi
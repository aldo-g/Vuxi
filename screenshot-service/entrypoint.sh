#!/bin/bash
set -e

# Define the output path - adjust if your command uses a different path
OUTPUT_DIR="/app/data/screenshots"

# Check if screenshots directory exists and clean up
if [ -d "$OUTPUT_DIR" ]; then
  echo "🧹 Cleaning up previous screenshot results..."
  rm -f $OUTPUT_DIR/metadata.json
  rm -f $OUTPUT_DIR/desktop/*.png
  echo "✅ Cleanup complete"
fi

# Make sure the directory exists
mkdir -p $OUTPUT_DIR/desktop

# Download URLs from S3 if in AWS environment
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Downloading URLs from S3..."
  /app/s3-download.sh
fi

# Execute the command passed to docker run
"$@"

# Upload results to S3 if in AWS environment
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Uploading screenshots to S3..."
  /app/s3-upload.sh "$OUTPUT_DIR/desktop"
fi
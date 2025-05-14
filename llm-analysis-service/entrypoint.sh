#!/bin/bash
set -e

# Define the output path - adjust if your command uses a different path
OUTPUT_DIR="/app/data/analysis"

# Check if analysis directory exists and clean up analysis files
if [ -d "$OUTPUT_DIR" ]; then
  echo "🧹 Cleaning up previous analysis results..."
  rm -f $OUTPUT_DIR/analysis.json $OUTPUT_DIR/analysis-metadata.json
  echo "✅ Cleanup complete"
fi

# Make sure the directory exists
mkdir -p $OUTPUT_DIR

# Execute the command passed to docker run
exec "$@"
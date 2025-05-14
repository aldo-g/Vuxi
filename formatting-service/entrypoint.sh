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

# Execute the command passed to docker run
exec "$@"
#!/bin/bash
set -e

# Define the output path - adjust if your command uses a different path
OUTPUT_DIR="/app/data/lighthouse"

# Check if lighthouse directory exists and clean up lighthouse files
if [ -d "$OUTPUT_DIR" ]; then
  echo "🧹 Cleaning up previous Lighthouse results..."
  rm -f $OUTPUT_DIR/lighthouse-summary.json
  rm -f $OUTPUT_DIR/reports/*.json
  rm -f $OUTPUT_DIR/trimmed/*_trimmed.json
  echo "✅ Cleanup complete"
fi

# Make sure the directory structure exists
mkdir -p $OUTPUT_DIR/reports
mkdir -p $OUTPUT_DIR/trimmed

# Execute the command passed to docker run
exec "$@"
#!/bin/bash
set -e

# Define the output path - adjust if your command uses a different path
OUTPUT_DIR="/app/data"

# Check if data directory exists and clean up only URL discovery files
if [ -d "$OUTPUT_DIR" ]; then
  echo "🧹 Cleaning up previous URL discovery results..."
  rm -f $OUTPUT_DIR/urls.json $OUTPUT_DIR/urls_simple.json
  echo "✅ Cleanup complete"
fi

# Make sure the directory exists
mkdir -p $OUTPUT_DIR

# Execute the command passed to docker run
exec "$@"
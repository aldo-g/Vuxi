#!/bin/bash
set -e

# Define the output path - adjust if your command uses a different path
OUTPUT_DIR="/app/data/screenshots"

# Check if screenshots directory exists and clean up only screenshot files
if [ -d "$OUTPUT_DIR" ]; then
  echo "🧹 Cleaning up previous screenshot results..."
  rm -f $OUTPUT_DIR/metadata.json
  rm -f $OUTPUT_DIR/desktop/*.png
  echo "✅ Cleanup complete"
fi

# Make sure the directory exists
mkdir -p $OUTPUT_DIR/desktop

# Execute the command passed to docker run
exec "$@"
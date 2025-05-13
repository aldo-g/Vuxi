#!/bin/bash

# run-formatting.sh - Script to format analysis data

# Load variables from .env file if it exists
if [ -f ".env" ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Check arguments
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./run-formatting.sh <ANALYSIS_JSON> [OUTPUT_JSON]"
    echo "Example: ./run-formatting.sh ./output/analysis/analysis.json ./output/analysis/structured-analysis.json"
    exit 1
fi

# Get absolute paths
INPUT_JSON=$(realpath "$1")
OUTPUT_JSON="${2:-"${INPUT_JSON%.json}-structured.json"}"
OUTPUT_DIR=$(dirname "$OUTPUT_JSON")

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "📄 Starting Formatting Service"
echo "📥 Input: $INPUT_JSON"
echo "📤 Output: $OUTPUT_JSON"
echo "----------------------------------------"

# Check for API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ERROR: ANTHROPIC_API_KEY environment variable is not set"
    echo "Please set it with: export ANTHROPIC_API_KEY=your-api-key"
    exit 1
fi

# Check if input file exists
if [ ! -f "$INPUT_JSON" ]; then
    echo "❌ ERROR: Input file does not exist: $INPUT_JSON"
    exit 1
fi

# Create a temporary directory for our data
TEMP_DIR=$(mktemp -d)
echo "📂 Using temporary directory: $TEMP_DIR"

# Copy analysis.json to temp directory
cp "$INPUT_JSON" "$TEMP_DIR/analysis.json"
echo "✅ Copied analysis.json to temporary directory"

# Run the formatting service
docker run --rm \
  -e ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  -v "$TEMP_DIR:/tmp/data" \
  -v "$OUTPUT_DIR:/app/output" \
  formatting-service node src/index.js \
  --input "/tmp/data/analysis.json" \
  --output "/app/output/$(basename "$OUTPUT_JSON")"

# Check if formatting was successful
if [ $? -eq 0 ]; then
    echo "✅ Formatting completed successfully"
    echo "📄 Structured data saved to: $OUTPUT_JSON"
else
    echo "❌ Error during formatting"
    exit 1
fi

# Clean up
echo "🧹 Cleaning up temporary directory"
rm -rf "$TEMP_DIR"
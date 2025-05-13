#!/bin/bash

# run-html-reports.sh - Script to generate HTML reports

# Load variables from .env file if it exists
if [ -f ".env" ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Check arguments
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./run-html-reports.sh <ANALYSIS_JSON> <SCREENSHOTS_DIR> [OUTPUT_DIR]"
    echo "Example: ./run-html-reports.sh ./output/analysis/analysis.json ./output/screenshots ./output/reports"
    exit 1
fi

# Get paths for inputs and outputs
ANALYSIS_JSON=$(realpath "$1")
SCREENSHOTS_DIR=$(realpath "$2")
OUTPUT_DIR="${3:-"./output/reports"}"  # Keep output dir as provided (may be relative)
mkdir -p "$OUTPUT_DIR"
OUTPUT_DIR=$(realpath "$OUTPUT_DIR")  # Now get the absolute path

echo "📄 Starting HTML Report Generator"
echo "📥 Analysis: $ANALYSIS_JSON"
echo "📸 Screenshots: $SCREENSHOTS_DIR"  
echo "📁 Output: $OUTPUT_DIR"
echo "----------------------------------------"

# Verify file and directories exist
if [ ! -f "$ANALYSIS_JSON" ]; then
    echo "❌ ERROR: Analysis file does not exist: $ANALYSIS_JSON"
    exit 1
fi

if [ ! -d "$SCREENSHOTS_DIR" ]; then
    echo "❌ ERROR: Screenshots directory does not exist: $SCREENSHOTS_DIR"
    exit 1
fi

echo "📝 Generating HTML reports..."

# Create a temporary directory for our data
TEMP_DIR=$(mktemp -d)
echo "📂 Using temporary directory: $TEMP_DIR"

# Copy analysis.json to temp directory
cp "$ANALYSIS_JSON" "$TEMP_DIR/analysis.json"

# Verify the copy worked
if [ ! -f "$TEMP_DIR/analysis.json" ]; then
    echo "❌ ERROR: Failed to copy analysis.json to temporary directory"
    exit 1
fi
echo "✅ Copied analysis.json to temporary directory"

# Run in a simpler way, using the /tmp directory inside the container
docker run --rm \
  -v "$TEMP_DIR:/tmp/data" \
  -v "$SCREENSHOTS_DIR:/app/screenshots" \
  -v "$OUTPUT_DIR:/app/output" \
  html-report-local node src/index.js \
  --input "/tmp/data/analysis.json" \
  --screenshots "/app/screenshots" \
  --output "/app/output"

# Check if generation was successful
RESULT=$?

# Clean up
echo "🧹 Cleaning up temporary directory"
rm -rf "$TEMP_DIR"

if [ $RESULT -eq 0 ]; then
    echo "✅ HTML reports generated successfully"
    echo "📂 Reports saved to: $OUTPUT_DIR"
    echo "🌐 Open the main report at: $OUTPUT_DIR/index.html"
else
    echo "❌ Error generating HTML reports"
    exit 1
fi
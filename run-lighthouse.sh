#!/bin/bash

# run-lighthouse.sh - Run just the Lighthouse service

# Load variables from .env file if it exists
if [ -f ".env" ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Check arguments
if [ -z "$1" ]; then
    echo "Usage: ./run-lighthouse.sh <urls_json_file> [output_dir]"
    echo "Example: ./run-lighthouse.sh ./output/urls/urls_simple.json ./output/lighthouse"
    exit 1
fi

URLS_FILE=$(realpath "$1")
OUTPUT_DIR=${2:-./output/lighthouse}

# Check if URLs file exists
if [ ! -f "$URLS_FILE" ]; then
    echo "❌ Error: URLs file does not exist: $URLS_FILE"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🚦 Starting Lighthouse Service"
echo "📥 Input: $URLS_FILE"
echo "📁 Output: $OUTPUT_DIR"
echo "----------------------------------------"

# Build image if not already built
if ! docker image inspect lighthouse-service-local >/dev/null 2>&1; then
    echo "🔨 Building lighthouse service image..."
    docker build -t lighthouse-service-local ./lighthouse-service
fi

# Run container
echo "🔍 Running Lighthouse audits..."
docker run --rm -it \
    -v "$URLS_FILE:/app/urls.json" \
    -v "$OUTPUT_DIR:/app/output" \
    lighthouse-service-local \
    node src/index.js \
    --input /app/urls.json \
    --output /app/output

# Check status
if [ $? -eq 0 ]; then
    echo "✅ Lighthouse audits completed successfully"
    echo "📁 Reports saved to: $OUTPUT_DIR"
    
    # Count reports
    if [ -d "$OUTPUT_DIR/reports" ]; then
        REPORT_COUNT=$(ls -1 "$OUTPUT_DIR/reports" | grep ".json" | wc -l)
        echo "📊 Generated $REPORT_COUNT Lighthouse reports"
    fi
else
    echo "❌ Error during Lighthouse audits"
    exit 1
fi
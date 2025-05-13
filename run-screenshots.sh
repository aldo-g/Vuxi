#!/bin/bash

# run-screenshots.sh - Run just the screenshot service

# Load variables from .env file if it exists
if [ -f ".env" ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Check arguments
if [ -z "$1" ]; then
    echo "Usage: ./run-screenshots.sh <urls_json_file> [output_dir]"
    echo "Example: ./run-screenshots.sh ./output/urls/urls_simple.json ./output/screenshots"
    exit 1
fi

URLS_FILE=$(realpath "$1")
OUTPUT_DIR=${2:-./output/screenshots}

# Check if URLs file exists
if [ ! -f "$URLS_FILE" ]; then
    echo "❌ Error: URLs file does not exist: $URLS_FILE"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "📸 Starting Screenshot Service"
echo "📥 Input: $URLS_FILE"
echo "📁 Output: $OUTPUT_DIR"
echo "----------------------------------------"

# Build image if not already built
if ! docker image inspect screenshot-service-local >/dev/null 2>&1; then
    echo "🔨 Building screenshot service image..."
    docker build -t screenshot-service-local ./screenshot-service
fi

# Run container
echo "🖼️ Taking screenshots..."
docker run --rm -it \
    -v "$URLS_FILE:/app/urls.json" \
    -v "$OUTPUT_DIR:/app/output" \
    screenshot-service-local \
    node src/index.js \
    --input /app/urls.json \
    --output /app/output

# Check status
if [ $? -eq 0 ]; then
    echo "✅ Screenshot capture completed successfully"
    echo "📁 Screenshots saved to: $OUTPUT_DIR/desktop"
    
    # Count screenshots
    if [ -d "$OUTPUT_DIR/desktop" ]; then
        SCREENSHOT_COUNT=$(ls -1 "$OUTPUT_DIR/desktop" | grep ".png" | wc -l)
        echo "📸 Captured $SCREENSHOT_COUNT screenshots"
    fi
else
    echo "❌ Error during screenshot capture"
    exit 1
fi
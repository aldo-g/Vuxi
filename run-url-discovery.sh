#!/bin/bash

# run-url-discovery.sh - Run just the URL discovery service

# Load variables from .env file if it exists
if [ -f ".env" ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Check arguments
if [ -z "$1" ]; then
    echo "Usage: ./run-url-discovery.sh <start_url> [max_pages] [output_dir]"
    echo "Example: ./run-url-discovery.sh https://example.com 20 ./output/urls"
    exit 1
fi

START_URL=$1
MAX_PAGES=${2:-20}
OUTPUT_DIR=${3:-./output/urls}

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🔍 Starting URL Discovery Service"
echo "📍 URL: $START_URL"
echo "📊 Max pages: $MAX_PAGES"
echo "📁 Output: $OUTPUT_DIR"
echo "----------------------------------------"

# Build image if not already built
if ! docker image inspect url-discovery-local >/dev/null 2>&1; then
    echo "🔨 Building URL discovery service image..."
    docker build -t url-discovery-local ./url-discovery-service
fi

# Run container
echo "🕷️ Crawling URLs..."
docker run --rm -it \
    -v "$OUTPUT_DIR:/app/output" \
    url-discovery-local \
    node src/index.js \
    --url "$START_URL" \
    --max-pages "$MAX_PAGES" \
    --output /app/output/urls.json

# Check status
if [ $? -eq 0 ]; then
    echo "✅ URL discovery completed successfully"
    echo "📁 Results saved to: $OUTPUT_DIR"
    
    # Count URLs
    if [ -f "$OUTPUT_DIR/urls_simple.json" ]; then
        URL_COUNT=$(cat "$OUTPUT_DIR/urls_simple.json" | grep -o "http" | wc -l)
        echo "🔗 Discovered $URL_COUNT URLs"
    fi
else
    echo "❌ Error during URL discovery"
    exit 1
fi
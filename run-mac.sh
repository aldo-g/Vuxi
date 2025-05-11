#!/bin/bash

# run-mac.sh - macOS compatible runner for all services

if [ -z "$1" ]; then
    echo "Usage: ./run-mac.sh <START_URL> [MAX_PAGES]"
    echo "Example: ./run-mac.sh https://odeion.com.au 10"
    exit 1
fi

export START_URL=$1
export MAX_PAGES=${2:-20}

echo "🚀 Starting website analysis pipeline"
echo "📍 URL: $START_URL"
echo "📊 Max pages: $MAX_PAGES"
echo "----------------------------------------"

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker rm -f url-discovery-temp screenshot-temp lighthouse-temp 2>/dev/null

# Create output directory
mkdir -p output

# Build images with unique tags
echo "🔨 Building containers..."
echo "  Building URL discovery service..."
docker build -t url-discovery-local ./url-discovery-service

echo "  Building screenshot service..."
docker build -t screenshot-service-local ./screenshot-service

echo "  Building lighthouse service..."
docker build -t lighthouse-service-local ./lighthouse-service

# Check if all builds were successful
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to build one or more containers"
    exit 1
fi

# 1. Run URL discovery
echo "🔍 Discovering URLs..."
docker run -d --name url-discovery-temp url-discovery-local sh -c "while true; do sleep 1; done"
docker exec url-discovery-temp npm start -- --url "$START_URL" --max-pages "$MAX_PAGES" --output /tmp/urls.json

# Wait for URL discovery to complete
sleep 2

# Copy URLs from container
echo "📥 Copying URL list..."
docker cp url-discovery-temp:/tmp/urls_simple.json ./output/urls.json
docker rm -f url-discovery-temp

# 2. Run screenshot and lighthouse services concurrently
echo "📸🚦 Starting screenshots and Lighthouse audits..."

# Start screenshot service
docker run -d --name screenshot-temp screenshot-service-local sh -c "while true; do sleep 1; done"
docker cp ./output/urls.json screenshot-temp:/tmp/urls.json
(
    echo "🖼️  Running screenshot service..."
    docker exec screenshot-temp npm start -- --input /tmp/urls.json --output /tmp/screenshots
    echo "📥 Copying screenshots..."
    docker cp screenshot-temp:/tmp/screenshots ./output/screenshots
    docker rm -f screenshot-temp
    echo "✅ Screenshots completed"
) &

# Start lighthouse service
docker run -d --name lighthouse-temp lighthouse-service-local sh -c "while true; do sleep 1; done"
docker cp ./output/urls.json lighthouse-temp:/tmp/urls.json
(
    echo "🚦 Running Lighthouse service..."
    docker exec lighthouse-temp npm start -- --input /tmp/urls.json --output /tmp/lighthouse
    echo "📥 Copying Lighthouse reports..."
    docker cp lighthouse-temp:/tmp/lighthouse ./output/lighthouse
    docker rm -f lighthouse-temp
    echo "✅ Lighthouse completed"
) &

# Wait for both services to complete
wait

# Cleanup
rm ./output/urls.json

echo "----------------------------------------"
echo "✅ All services completed!"

# Summary statistics
if [ -d "output/screenshots/desktop" ]; then
    SCREENSHOT_COUNT=$(ls output/screenshots/desktop | wc -l)
    echo "📸 Screenshots captured: $SCREENSHOT_COUNT"
fi

if [ -d "output/lighthouse/reports" ]; then
    LIGHTHOUSE_COUNT=$(ls output/lighthouse/reports | wc -l)
    echo "🚦 Lighthouse reports generated: $LIGHTHOUSE_COUNT"
fi

if [ -f "output/lighthouse/lighthouse-summary.json" ]; then
    echo "📊 Lighthouse summary available"
fi

echo "📁 Results saved to:"
echo "   - Screenshots: output/screenshots/desktop/"
echo "   - Lighthouse reports: output/lighthouse/reports/"
echo "   - Lighthouse trimmed: output/lighthouse/trimmed/"
echo "   - Summary: output/lighthouse/lighthouse-summary.json"
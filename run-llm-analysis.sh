#!/bin/bash

# run-llm-analysis.sh - Run just the LLM analysis service

# Load variables from .env file if it exists
if [ -f ".env" ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Check if API key is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ERROR: ANTHROPIC_API_KEY environment variable is not set"
    echo "Please set it with: export ANTHROPIC_API_KEY=your-api-key"
    echo "Or add it to your .env file"
    exit 1
fi

# Check arguments
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./run-llm-analysis.sh <screenshots_dir> <lighthouse_dir> [output_dir] [model]"
    echo "Example: ./run-llm-analysis.sh ./output/screenshots ./output/lighthouse ./output/analysis claude-3-7-sonnet-20250219"
    exit 1
fi

SCREENSHOTS_DIR=$(realpath "$1")
LIGHTHOUSE_DIR=$(realpath "$2")
OUTPUT_DIR=${3:-./output/analysis}
MODEL=${4:-claude-3-7-sonnet-20250219}

# Check if directories exist
if [ ! -d "$SCREENSHOTS_DIR" ]; then
    echo "❌ Error: Screenshots directory does not exist: $SCREENSHOTS_DIR"
    exit 1
fi

if [ ! -d "$LIGHTHOUSE_DIR" ]; then
    echo "❌ Error: Lighthouse directory does not exist: $LIGHTHOUSE_DIR"
    exit 1
fi

# Make sure screenshot desktop directory exists
if [ ! -d "$SCREENSHOTS_DIR/desktop" ]; then
    echo "❌ Error: Screenshots desktop directory not found: $SCREENSHOTS_DIR/desktop"
    exit 1
fi

# Make sure lighthouse trimmed directory exists
if [ ! -d "$LIGHTHOUSE_DIR/trimmed" ]; then
    echo "❌ Error: Lighthouse trimmed directory not found: $LIGHTHOUSE_DIR/trimmed"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🤖 Starting LLM Analysis Service"
echo "📸 Screenshots: $SCREENSHOTS_DIR"
echo "🚦 Lighthouse: $LIGHTHOUSE_DIR"
echo "📁 Output: $OUTPUT_DIR"
echo "🧠 Model: $MODEL"
echo "🔑 Using API key: ${ANTHROPIC_API_KEY:0:5}...${ANTHROPIC_API_KEY: -5}"
echo "----------------------------------------"

# Build image if not already built
if ! docker image inspect llm-analysis-local >/dev/null 2>&1; then
    echo "🔨 Building LLM analysis service image..."
    docker build -t llm-analysis-local ./llm-analysis-service
fi

# Run container
echo "🧠 Running LLM analysis..."
docker run --rm -it \
    -e ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
    -v "$SCREENSHOTS_DIR/desktop:/app/data/screenshots/desktop" \
    -v "$LIGHTHOUSE_DIR/trimmed:/app/data/lighthouse/trimmed" \
    -v "$OUTPUT_DIR:/app/data/analysis" \
    llm-analysis-local \
    node src/index.js \
    --screenshots /app/data/screenshots \
    --lighthouse /app/data/lighthouse \
    --output /app/data/analysis \
    --provider anthropic \
    --model "$MODEL"

# Check status
if [ $? -eq 0 ]; then
    echo "✅ LLM analysis completed successfully"
    echo "📁 Analysis saved to: $OUTPUT_DIR"
    
    # Check if analysis.json exists
    if [ -f "$OUTPUT_DIR/analysis.json" ]; then
        echo "✓ analysis.json generated"
    else
        echo "⚠️ Warning: analysis.json not found"
    fi
else
    echo "❌ Error during LLM analysis"
    exit 1
fi
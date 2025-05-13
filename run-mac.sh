#!/bin/bash

# run-mac.sh - macOS compatible runner for all services

# Load variables from .env file if it exists
if [ -f ".env" ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

if [ -z "$1" ]; then
    echo "Usage: ./run-mac.sh <START_URL> [MAX_PAGES]"
    echo "Example: ./run-mac.sh https://odeion.com.au 10"
    exit 1
fi

# Check if API key is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ERROR: ANTHROPIC_API_KEY environment variable is not set"
    echo "Please set it with: export ANTHROPIC_API_KEY=your-api-key"
    exit 1
fi

export START_URL=$1
export MAX_PAGES=${2:-20}

echo "🚀 Starting website analysis pipeline"
echo "📍 URL: $START_URL"
echo "📊 Max pages: $MAX_PAGES"
echo "🔑 Using API key: ${ANTHROPIC_API_KEY:0:5}...${ANTHROPIC_API_KEY: -5}"
echo "----------------------------------------"

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker rm -f url-discovery-temp screenshot-temp lighthouse-temp analysis-temp html-report-temp 2>/dev/null

# Create output directory structure
mkdir -p output/urls
mkdir -p output/screenshots
mkdir -p output/lighthouse
mkdir -p output/analysis
mkdir -p output/reports

# Build images with unique tags
echo "🔨 Building containers..."
echo "  Building URL discovery service..."
docker build -t url-discovery-local ./url-discovery-service

echo "  Building screenshot service..."
docker build -t screenshot-service-local ./screenshot-service

echo "  Building lighthouse service..."
docker build -t lighthouse-service-local ./lighthouse-service

echo "  Building LLM analysis service..."
docker build -t llm-analysis-local ./llm-analysis-service

echo "  Building HTML report service..."
docker build -t html-report-local ./html-report-service

# 1. Run URL discovery
echo "🔍 Discovering URLs..."
docker run -d --name url-discovery-temp url-discovery-local sh -c "while true; do sleep 1; done"
if ! docker exec url-discovery-temp npm start -- --url "$START_URL" --max-pages "$MAX_PAGES" --output /tmp/urls.json; then
    echo "❌ URL discovery failed"
    docker rm -f url-discovery-temp
    exit 1
fi

# Copy URLs from container
echo "📥 Copying URL list..."
docker cp url-discovery-temp:/tmp/urls.json ./output/urls/urls.json
docker cp url-discovery-temp:/tmp/urls_simple.json ./output/urls/urls_simple.json
docker rm -f url-discovery-temp

# 2. Run screenshot and lighthouse services concurrently
echo "📸🚦 Starting screenshots and Lighthouse audits..."

# Start screenshot service
docker run -d --name screenshot-temp screenshot-service-local sh -c "while true; do sleep 1; done"
docker cp ./output/urls/urls_simple.json screenshot-temp:/tmp/urls.json
(
    echo "🖼️  Running screenshot service..."
    if ! docker exec screenshot-temp npm start -- --input /tmp/urls.json --output /tmp/output; then
        echo "❌ Screenshot service failed"
    else
        echo "📥 Copying screenshots..."
        docker cp screenshot-temp:/tmp/output/desktop ./output/screenshots/
        docker cp screenshot-temp:/tmp/output/metadata.json ./output/screenshots/
        echo "✅ Screenshots completed"
    fi
    docker rm -f screenshot-temp
) &
SCREENSHOT_PID=$!

# Start lighthouse service
docker run -d --name lighthouse-temp lighthouse-service-local sh -c "while true; do sleep 1; done"
docker cp ./output/urls/urls_simple.json lighthouse-temp:/tmp/urls.json
(
    echo "🚦 Running Lighthouse service..."
    if ! docker exec lighthouse-temp npm start -- --input /tmp/urls.json --output /tmp/output; then
        echo "❌ Lighthouse service failed"
    else
        echo "📥 Copying Lighthouse reports..."
        docker cp lighthouse-temp:/tmp/output/reports ./output/lighthouse/
        docker cp lighthouse-temp:/tmp/output/trimmed ./output/lighthouse/
        docker cp lighthouse-temp:/tmp/output/lighthouse-summary.json ./output/lighthouse/
        echo "✅ Lighthouse completed"
    fi
    docker rm -f lighthouse-temp
) &
LIGHTHOUSE_PID=$!

# Wait for both services to complete
wait $SCREENSHOT_PID
wait $LIGHTHOUSE_PID

# Check if required directories exist
if [ ! -d "output/screenshots/desktop" ] || [ ! -d "output/lighthouse/trimmed" ]; then
    echo "❌ Required data for analysis is missing"
    echo "   Please check if screenshots and lighthouse services completed successfully"
    exit 1
fi

# 3. Run LLM analysis
echo "🤖 Running LLM analysis..."
docker run -d --name analysis-temp \
    -e ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
    llm-analysis-local sleep 3600

docker exec analysis-temp mkdir -p /app/data/screenshots
docker exec analysis-temp mkdir -p /app/data/lighthouse
docker cp output/screenshots/desktop analysis-temp:/app/data/screenshots/
docker cp output/lighthouse/trimmed analysis-temp:/app/data/lighthouse/

# Run the analysis with the API key explicitly passed
if ! docker exec -e ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" analysis-temp npm start -- \
    --screenshots /app/data/screenshots \
    --lighthouse /app/data/lighthouse \
    --output /app/data/analysis \
    --provider anthropic \
    --model claude-3-7-sonnet-20250219; then
    
    echo "❌ LLM analysis failed"
    echo "{\"error\": \"Analysis failed\", \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" > output/analysis/analysis.json
else
    echo "✅ LLM analysis completed successfully"
    
    # Copy the analysis output
    echo "📥 Copying analysis results..."
    docker cp analysis-temp:/app/data/analysis/analysis.json ./output/analysis/
    docker cp analysis-temp:/app/data/analysis/analysis-metadata.json ./output/analysis/
fi

docker rm -f analysis-temp

# 4. Generate HTML reports
echo "📄 Generating HTML reports..."
docker run -d --name html-report-temp html-report-local sleep 3600

# Create directories in the container
docker exec html-report-temp mkdir -p /app/data/analysis
docker exec html-report-temp mkdir -p /app/data/screenshots/desktop
docker exec html-report-temp mkdir -p /app/data/reports

# Copy analysis.json if it exists
if [ -f "output/analysis/analysis.json" ]; then
    docker cp output/analysis/analysis.json html-report-temp:/app/data/analysis/
    docker cp output/screenshots/desktop/. html-report-temp:/app/data/screenshots/desktop/
    
    if ! docker exec html-report-temp npm start -- \
        --input /app/data/analysis/analysis.json \
        --screenshots /app/data/screenshots \
        --output /app/data/reports; then
        
        echo "❌ HTML report generation failed"
        # Create a fallback error report
        mkdir -p output/reports
        cat > output/reports/index.html << EOF
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Report Generation Failed</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    h1 { color: #e74c3c; }
    .error-box { background: #fff5f5; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>HTML Report Generation Failed</h1>
    <div class="error-box">
      <p>There was an error generating the HTML reports.</p>
      <p>Please check the logs for more information.</p>
    </div>
  </div>
</body>
</html>
EOF
    else
        echo "✅ HTML reports generated successfully"
        echo "📥 Copying HTML reports..."
        
        # Check if reports directory exists
        if docker exec html-report-temp ls -la /app/data/reports; then
            # Copy all files from the reports directory
            docker cp html-report-temp:/app/data/reports/. output/reports/
            
            # Check if files were copied
            if [ "$(ls -A output/reports)" ]; then
                echo "✅ HTML reports copied successfully"
            else
                echo "⚠️ WARNING: Reports directory appears to be empty"
            fi
        else
            echo "❌ Reports directory not found in container"
        fi
    fi
else
    echo "❌ Cannot generate HTML reports: analysis.json is missing"
    # Create a simple error HTML file
    mkdir -p output/reports
    cat > output/reports/index.html << EOF
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Analysis Data Missing</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    h1 { color: #e74c3c; }
    .error-box { background: #fff5f5; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Analysis Data Missing</h1>
    <div class="error-box">
      <p>No analysis data is available. The analysis step may have failed.</p>
      <p>Please check the logs for more information and try running the analysis again.</p>
    </div>
  </div>
</body>
</html>
EOF
fi

docker rm -f html-report-temp

echo "----------------------------------------"
echo "✅ Analysis pipeline completed!"

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

if [ -f "output/analysis/analysis.json" ]; then
    echo "🤖 LLM analysis complete"
fi

if [ -d "output/reports" ]; then
    REPORT_COUNT=$(ls output/reports | wc -l)
    echo "📄 HTML reports generated: $REPORT_COUNT files"
    echo "🌐 Open the HTML report at: output/reports/index.html"
fi

echo "📁 Results saved to:"
echo "   - URLs: output/urls/"
echo "   - Screenshots: output/screenshots/desktop/"
echo "   - Lighthouse reports: output/lighthouse/reports/"
echo "   - Lighthouse trimmed: output/lighthouse/trimmed/"
echo "   - Analysis: output/analysis/"
echo "   - HTML Reports: output/reports/"
#!/bin/bash

# Start both services for development
echo "🚀 Starting Vuxi Development Environment"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found in root directory!"
    exit 1
fi

# Kill any existing processes on these ports
echo "🧹 Cleaning up existing processes..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "next" 2>/dev/null || true
sleep 2

# Install dependencies
echo "📦 Installing capture service dependencies..."
cd packages/capture && npm install > /dev/null 2>&1
cd ../..

# Start capture service with live console output
echo "📦 Starting Capture Service on port 3001..."
cd packages/capture
# Start in background but don't redirect output
node server.js &
CAPTURE_PID=$!
cd ../..

# Wait for capture service to start
echo "⏳ Waiting for capture service to start..."
for i in {1..10}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Capture Service is running"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ Capture Service failed to start"
        kill $CAPTURE_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# Start Next.js app (redirect only Next.js output since it's verbose)
echo "🌐 Starting Next.js App on port 3000..."
cd packages/next-app && npm run dev > ../nextjs.log 2>&1 &
NEXTJS_PID=$!
cd ../..

# Display status
echo ""
echo "✅ Both services are running!"
echo "📊 Capture Service: http://localhost:3001/health"
echo "🌐 Next.js App: http://localhost:3000"
echo ""
echo "📋 Capture service logs will appear below:"
echo "   (URL discovery progress should show here)"
echo ""

# Function to cleanup when script exits
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $CAPTURE_PID 2>/dev/null
    kill $NEXTJS_PID 2>/dev/null
    echo "✅ Services stopped"
    exit
}

# Set trap to cleanup on script termination
trap cleanup SIGINT SIGTERM

# Wait for services (this will show capture service output)
wait
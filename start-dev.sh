#!/bin/bash

# Start both services for development
echo "🚀 Starting Vuxi Development Environment"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found in root directory!"
    echo "Please create .env file with required variables:"
    echo "CAPTURE_SERVICE_URL=http://localhost:3001"
    echo "JWT_SECRET=your_jwt_secret_here"
    echo "DATABASE_URL=\"file:./dev.db\""
    exit 1
fi

# Kill any existing processes on these ports
echo "🧹 Cleaning up existing processes..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "next" 2>/dev/null || true
sleep 2

# Install dependencies if needed
echo "📦 Installing capture service dependencies..."
cd packages/capture
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "Dependencies already installed"
fi

# Start capture service in background
echo "📦 Starting Capture Service on port 3001..."
node server.js > ../../capture.log 2>&1 &
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
        echo "❌ Capture Service failed to start after 10 seconds"
        echo "📋 Capture service logs:"
        cat capture.log
        kill $CAPTURE_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# Install Next.js dependencies
echo "📦 Installing Next.js dependencies..."
cd packages/next-app
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "Dependencies already installed"
fi

# Start Next.js app
echo "🌐 Starting Next.js App on port 3000..."
npm run dev > ../../nextjs.log 2>&1 &
NEXTJS_PID=$!
cd ../..

# Wait for user to stop
echo ""
echo "✅ Both services are running!"
echo "📊 Capture Service: http://localhost:3001/health"
echo "🌐 Next.js App: http://localhost:3000"
echo "🔧 Conduct Analysis: http://localhost:3000/conduct-analysis"
echo ""
echo "📝 Environment loaded from root .env file"
echo "📋 Logs: capture.log and nextjs.log"
echo ""
echo "Press Ctrl+C to stop both services"

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

# Wait for services
wait
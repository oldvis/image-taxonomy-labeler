
#!/usr/bin/env bash
# Script to start backend and client-compare with dependency checks

echo "🚀 Starting Image Taxonomy Comparison Interface..."

# Start backend in background
echo "Starting backend server on http://localhost:5001..."
cd server
source ./start.sh &
BACKEND_PID=$!
cd ..

sleep 2

# Start client-compare
echo "Starting client-compare on http://localhost:3333..."
cd client-compare
source ./start.sh &
CLIENT_PID=$!
cd ..

echo "🎉 Image Taxonomy Comparison Interface is starting up!"
echo "📱 Frontend: http://localhost:3333"
echo "🔧 Backend API: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop both servers."

# Cleanup on exit
cleanup() {
	echo ""
	echo "🛑 Stopping servers..."
	kill $BACKEND_PID 2>/dev/null
	kill $CLIENT_PID 2>/dev/null
	echo "✅ Servers stopped"
	exit 0
}
trap cleanup SIGINT SIGTERM

# Wait for background jobs
wait $BACKEND_PID $CLIENT_PID

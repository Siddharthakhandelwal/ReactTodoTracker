#!/bin/bash

# Start the Flask server in the background
echo "Starting Flask server on port 5001..."
python server.py &
FLASK_PID=$!

# Start the Express server
echo "Starting Express server on port 5000..."
npm run dev

# If the Express server exits, kill the Flask server
kill $FLASK_PID
#!/bin/bash

# UCM University Enrollment System Startup Script

echo "Starting UCM University Enrollment System..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "pip3 is not installed. Please install pip3 first."
    exit 1
fi

# Install dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "Installing Python dependencies..."
    pip3 install -r requirements.txt
    echo ""
fi

# Create necessary directories
mkdir -p templates static/css static/js

echo "Starting Flask application..."
echo "Open your browser and go to: http://localhost:5001"
echo "Demo accounts are available in the README.md file"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the Flask application
python3 app.py

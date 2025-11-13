#!/bin/bash

# ACME University Enrollment System - Run Script for Virtual Environment

echo "🎓 Starting ACME University Enrollment System..."
echo ""

# Activate virtual environment and run the app
cd "/Users/deviousprius/Documents/CSE 108"
source .venv/bin/activate

echo "📦 Virtual environment activated"
echo "🚀 Starting Flask application on port 5001..."
echo "📱 Open your browser and go to: http://localhost:5001"
echo "🔑 Demo accounts are available in the README.md file"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the Flask app
python "labs/Lab 8/app.py"

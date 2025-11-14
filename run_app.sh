echo "Starting UC Merced Enrollment System..."
echo ""

cd "/Users/deviousprius/Documents/CSE 108"
source .venv/bin/activate

echo "Virtual environment activated"
echo "Starting Flask application on port 5001..."
echo "Open your browser and go to: http://localhost:5001"
echo "Demo accounts are available in the README.md file"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python "labs/Lab 8/app.py"

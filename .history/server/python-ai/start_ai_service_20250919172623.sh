#!/bin/bash

# Start the Python AI service
echo "Starting Python AI service..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "pip3 is not installed. Please install pip3."
    exit 1
fi

# Install requirements if not already installed
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Start the Flask app
echo "Starting AI service on port 5001..."
python3 app.py

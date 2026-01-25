#!/bin/bash
set -e

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install bindings
echo "Installing leapc-cffi..."
pip install ../leapc-python-bindings/leapc-cffi

echo "Installing leapc-python-api..."
pip install ../leapc-python-bindings/leapc-python-api

echo "Installing websockets..."
pip install websockets

echo "Setup complete. Run ./run.sh to start the script."

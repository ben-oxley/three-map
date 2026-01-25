#!/bin/bash

# Ensure we are in the web directory to run commands
# Assuming this script is run from 'map-app/customisations' or similar, we need to find 'web'
# But based on directory structure, map-app/web is the project root.

cd ../web

# 1. Install packages (including electron) defined in our custom script if not present
# We simply run the add-packages logic (manually or via script) - but let's just ensure electron is available.
# We will use the customisations/add-packages.sh content as a guide
echo "Installing dependencies..."
npm install -s mqtt@5.6.0 electron express

# 2. Run Electron
# We point to the main.js located in customisations
# Symlink node_modules to customisations so the module resolution works for main.js 
# (which sits in customisations but requires packages from web)
ln -sf $(pwd)/node_modules ../customisations/node_modules

echo "Starting Electron..."
./node_modules/.bin/electron ../customisations/electron-main.js --no-sandbox

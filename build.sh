#!/bin/bash

# Exit on any error
set -e

# Print commands before executing them
set -x

# Clear node_modules to ensure a clean install
echo "Cleaning node_modules..."
rm -rf node_modules
rm -f package-lock.json

# Install dependencies with verbose logging
echo "Installing dependencies..."
npm install --verbose

# Verify that next-pwa is installed
if [ ! -d "node_modules/next-pwa" ]; then
  echo "next-pwa not found in node_modules, installing it directly..."
  npm install next-pwa --save
fi

# Build the project
echo "Building project..."
npm run build

echo "Build completed successfully!" 
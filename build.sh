#!/bin/bash

# Build script for PicPocket application

echo "Building PicPocket application..."

# Create dist directory if it doesn't exist
mkdir -p dist

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Copy built frontend to dist
echo "Copying frontend build to dist..."
cp -r frontend/build/* dist/

# Build worker
echo "Building worker..."
node build-worker.js

echo "Build complete! Files are in the dist/ directory."
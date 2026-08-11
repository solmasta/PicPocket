#!/bin/bash

# Test build script for PicPocket application

echo "Testing PicPocket build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Run build test
echo "Running build test..."
node test-build.js

if [ $? -eq 0 ]; then
    echo "✅ Build test passed!"
else
    echo "❌ Build test failed!"
    exit 1
fi

echo "Testing frontend build..."
cd frontend
npm install
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build passed!"
else
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "All tests passed! ✅"
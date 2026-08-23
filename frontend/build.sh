#!/bin/bash

echo "🚀 Starting PicPocket Deployment..."

# Navigate to frontend directory
cd frontend

echo "📦 Installing dependencies..."
npm install

echo "🔧 Running tests..."
npm test -- --coverage --watchAll=false

echo "🏗️ Building for production..."
npm run build

echo "📊 Analyzing bundle size..."
npm run analyze

echo "🚀 Deploying to GitHub Pages..."
npm run deploy

echo "✅ Deployment complete!"
echo "🌐 Your app should be live at: https://solmasta.github.io/PicPocket/"
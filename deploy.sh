#!/bin/bash

echo "🚀 Starting PicPocket Full Deployment..."

# Navigate to frontend directory
echo "📦 Building Frontend..."
cd frontend
npm install
npm run build --silent
echo "✅ Frontend build complete!"

# Deploy frontend to GitHub Pages
echo "🚀 Deploying Frontend to GitHub Pages..."
npm run deploy --silent
echo "✅ Frontend deployed to https://solmasta.github.io/PicPocket/"

# Navigate to backend directory
echo "📦 Building Backend..."
cd ../backend
npm install --silent
echo "✅ Backend dependencies installed!"

# Deploy backend to Cloudflare Workers
echo "🚀 Deploying Backend to Cloudflare Workers..."
wrangler deploy
echo "✅ Backend deployed to Cloudflare Workers!"

echo "🎉 Full deployment complete!"
echo "🌐 Frontend: https://solmasta.github.io/PicPocket/"
echo "🔗 Backend: https://pic-pocket-api.solmasta.workers.dev"
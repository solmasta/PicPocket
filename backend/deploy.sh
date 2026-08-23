#!/bin/bash

echo "🌐 Deploying PicPocket Backend to Cloudflare Workers..."

# Navigate to backend directory
cd backend

echo "📦 Installing dependencies..."
npm install

echo "🧪 Running tests..."
npm test

echo "🚀 Deploying to Cloudflare Workers..."
wrangler deploy

echo "✅ Backend deployment complete!"
echo "🔗 Your API is now live on Cloudflare Workers!"
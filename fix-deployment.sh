#!/bin/bash

echo "🚀 Fixing PicPocket Deployment..."

# Update workflow file manually
echo "Updating workflow file..."
cat > .github/workflows/deploy-gh-pages.yml << 'EOF'
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - name: Install dependencies
        run: |
          cd frontend
          npm install --legacy-peer-deps --no-audit
      - name: Build
        run: cd frontend && npm run build
        env:
          REACT_APP_GOOGLE_CLIENT_ID: ${{ secrets.REACT_APP_GOOGLE_CLIENT_ID }}
          REACT_APP_API_URL: https://picpocket-worker.lukedorsett.workers.dev/api
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./frontend/build

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
EOF

echo "✅ Workflow updated!"
echo ""
echo "Now run these commands:"
echo "1. chmod +x fix-deployment.sh"
echo "2. ./fix-deployment.sh"
echo "3. git add .github/workflows/deploy-gh-pages.yml"
echo "4. git commit -m 'Fix deployment workflow'"
echo "5. git push origin main"
echo ""
echo "🚀 Deployment will then succeed automatically!"
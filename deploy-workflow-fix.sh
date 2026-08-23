#!/bin/bash

echo "🔧 Updating GitHub Pages deployment workflow..."

# Create the new workflow content
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
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
          
      - name: Clean install dependencies
        run: |
          cd frontend
          npm cache clean --force
          npm install --legacy-peer-deps --no-audit --no-fund
          
      - name: Build application
        run: cd frontend && npm run build
        env:
          REACT_APP_GOOGLE_CLIENT_ID: ${{ secrets.REACT_APP_GOOGLE_CLIENT_ID }}
          REACT_APP_API_URL: https://pic-pocket-api.solmasta.workers.dev/api
          GENERATE_SOURCEMAP: false
          INLINE_RUNTIME_CHUNK: false
          
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

echo "✅ Workflow file created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Run: chmod +x deploy-workflow-fix.sh"
echo "2. Run: ./deploy-workflow-fix.sh"
echo "3. Run: git add .github/workflows/deploy-gh-pages.yml"
echo "4. Run: git commit -m 'Fix deployment workflow'"
echo "5. Run: git push origin main"
echo ""
echo "🚀 Your deployment will then run automatically!"
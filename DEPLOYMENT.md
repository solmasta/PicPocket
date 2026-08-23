# 🚀 PicPocket Deployment Commands

## Run These Commands for Deployment

### 1. Make the script executable
```bash
chmod +x deploy.sh
```

### 2. Run the full deployment
```bash
./deploy.sh
```

## What the deployment does:

### Frontend Deployment (GitHub Pages)
```bash
cd frontend
npm install
npm run build
npm run deploy
```
- Builds optimized production bundle
- Runs tests for quality assurance
- Deploys to https://solmasta.github.io/PicPocket/

### Backend Deployment (Cloudflare Workers)
```bash
cd backend
npm install
wrangler deploy
```
- Builds and deploys API to Cloudflare Workers
- Available at: https://pic-pocket-api.solmasta.workers.dev

## Verification Commands

After deployment, verify with:
```bash
# Check frontend
curl https://solmasta.github.io/PicPocket/

# Check backend API
curl https://pic-pocket-api.solmasta.workers.dev/health
```

## Production Features Enabled
✅ PWA with offline support
✅ Performance monitoring
✅ Error reporting
✅ SEO optimization
✅ Security headers
✅ Accessibility features
✅ Bundle optimization
# 🚀 PicPocket Deployment Guide

## Quick Deploy (One Command)

```bash
npm run deploy
```

This will:
- Build and test the frontend
- Deploy frontend to GitHub Pages
- Deploy backend to Cloudflare Workers

## Manual Deployment Steps

### Frontend (GitHub Pages)
```bash
cd frontend
npm install
npm run build
npm run deploy
```

### Backend (Cloudflare Workers)
```bash
cd backend
npm install
wrangler deploy
```

## Production URLs
- **Frontend**: https://solmasta.github.io/PicPocket/
- **Backend**: https://pic-pocket-api.solmasta.workers.dev

## Environment Variables
Frontend production variables are configured in `frontend/.env.production`

## Monitoring
- Performance metrics are automatically collected
- Error reporting is enabled in production
- Bundle analysis available via `npm run analyze`
# Deployment Guide for PicPocket

## GitHub Pages Deployment

The application is automatically deployed to GitHub Pages using the existing workflow in `.github/workflows/deploy-gh-pages.yml`.

## Cloudflare Deployment

To deploy to Cloudflare Workers, follow these steps:

### Prerequisites

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

### Setup Cloudflare Resources

1. Create a D1 database:
   ```bash
   wrangler d1 create picpocket
   ```

2. Update the database ID in `wrangler.toml`

3. Apply the database schema:
   ```bash
   wrangler d1 execute picpocket --file=backend/schema.sql
   ```

4. Create an R2 bucket:
   ```bash
   wrangler r2 bucket create picpocket-photos
   ```

### Deploy the Application

1. Build the frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. Build the worker:
   ```bash
   cd ..
   npm install
   npm run build:worker
   ```

3. Deploy to Cloudflare:
   ```bash
   wrangler deploy
   ```

### Environment Variables

Set the following secrets in your GitHub repository for automated deployment:

- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Workers permissions
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `REACT_APP_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `REACT_APP_ONEDRIVE_CLIENT_ID` - OneDrive client ID (optional)
- `REACT_APP_DROPBOX_CLIENT_ID` - Dropbox client ID (optional)

## Local Development

### Frontend

```bash
cd frontend
npm install
npm start
```

### Backend

```bash
cd backend
npm install
npm run dev
```
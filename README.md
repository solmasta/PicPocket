# PicPocket
Pic-Pocket is a fun, easy-to-use photo storage app that keeps your memories safe. Snap, tag, and share your favorite moments with automatic backups to Google Photos and Drive. Create collages, stories, and slideshows, or use AI to auto-tag your photos. Perfect for capturing and reliving all your special moments

## Google Sign-In / Drive & Photos Setup

The app runs fully offline with no sign-in required (photos are stored in the browser via IndexedDB). The "Sign in with Google" screen and the "Sign Out" button in the header only appear once a Google OAuth Client ID is configured — without one, the app silently falls back to a local-only user and Drive/Photos backup is unavailable.

### 1. Create a Google OAuth Client ID

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create (or select) a project.
2. Under **APIs & Services → Library**, enable the **Google Drive API** and **Google Photos Library API**.
3. Under **APIs & Services → OAuth consent screen → Data Access**, click **Add or Remove Scopes** and add:
   - `openid`, `profile`, `email`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/photoslibrary.appendonly`
   - `https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata`

   Note: Google retired the broad `.../auth/photoslibrary` (full-library) scope on March 31, 2025. PicPocket only reads/writes its own "PicPals Backup" album, so the two narrower `appendonly` / `readonly.appcreateddata` scopes above are sufficient and are what the app actually requests.
4. Under **APIs & Services → Credentials → Create Credentials → OAuth client ID**, choose **Web application**.
5. Add **Authorized JavaScript origins**:
   - `http://localhost:3000` (local dev)
   - your deployed site's origin, e.g. `https://<github-username>.github.io` (GitHub Pages)
6. Save and copy the generated **Client ID** and **Client Secret** — both are required now that sign-in exchanges its authorization code for a refresh token server-side (see below), not just the Client ID as before.

### 2. Configure local development

- `frontend/.env` (copy from `frontend/.env.example`):
  ```
  REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here
  ```
- `backend/.env` (copy from `backend/.env.example`):
  ```
  GOOGLE_CLIENT_ID=your_client_id_here
  GOOGLE_CLIENT_SECRET=your_client_secret_here
  ```

Restart `npm start` in both `frontend/` and `backend/` after adding these — the sign-in screen and sign-out button will appear automatically once `REACT_APP_GOOGLE_CLIENT_ID` is set.

### 3. Configure the deployed (GitHub Pages) build

The GitHub Pages deploy workflow (`.github/workflows/deploy-gh-pages.yml`) builds the frontend with `REACT_APP_GOOGLE_CLIENT_ID` from a GitHub Actions secret, so it must be added to the repo:

1. In the GitHub repo, go to **Settings → Secrets and variables → Actions → New repository secret**.
2. Name: `REACT_APP_GOOGLE_CLIENT_ID`, Value: your Client ID.
3. Re-run the deploy workflow (or push to `main`) so the build picks it up.

Note: the deployed backend (wherever it's hosted) also needs `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` set as environment variables for server-side Drive/Photos operations to work.

### 4. Required for the live site: Cloudflare Worker environment variables

**The real deployment for this repo is a Cloudflare Pages build that runs `npx wrangler deploy`** (see `wrangler.toml` / `worker.js`), not the GitHub Pages workflow above. Sign-in now exchanges its one-time authorization code for a Google access token **and refresh token** via `POST /api/auth/google/token` (and silently renews the access token via `POST /api/auth/google/refresh`) — both handled by `worker.js`, which needs its own copy of the OAuth credentials:

1. In the Cloudflare dashboard, go to the Pages/Workers project → **Settings → Environment Variables**.
2. Add `GOOGLE_CLIENT_ID` (same value as `REACT_APP_GOOGLE_CLIENT_ID`) and `GOOGLE_CLIENT_SECRET` (mark it **Encrypt**, since it's a real secret).
3. Redeploy so the Worker picks them up.

**Without these two variables set on the Worker, Google sign-in will fail outright** (it no longer works purely client-side) — the sign-in screen will show "Google OAuth is not configured on the server" instead of signing anyone in.

# PicPals

PicPals is a photo storage app that keeps your memories safe. Snap, tag, and share your favorite moments with automatic backups to Google Photos and Drive.

## Project Structure

```
picpals/
├── frontend/           # React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.js           # Google OAuth sign-in
│   │   │   ├── HorseProfile.js   # Individual horse profile view
│   │   │   ├── PhotoGallery.js   # Main photo grid + upload
│   │   │   ├── Settings.js       # User settings & logout
│   │   │   └── HorseFeatures.js  # Feature list sub-component
│   │   ├── services/
│   │   │   ├── googleAuth.js     # Auth API calls
│   │   │   └── photoService.js   # Photo API calls
│   │   └── App.js
├── backend/            # Express API
│   ├── routes/
│   │   ├── auth.js    # POST /api/auth/google, /refresh, /logout
│   │   ├── photos.js  # CRUD + Google Photos sync
│   │   └── horses.js  # CRUD horse profiles
│   ├── services/
│   │   └── googleApi.js  # Google OAuth & Photos API helpers
│   └── server.js
└── .env.example
```

## Getting Started

### Prerequisites
- Node.js 18+
- A Google Cloud project with OAuth 2.0 credentials and the Google Photos Library API enabled

### Setup

1. Copy `.env.example` to `backend/.env` and `frontend/.env` and fill in your values.

2. Install dependencies:
   ```bash
   cd picpals/backend && npm install
   cd ../frontend && npm install
   ```

3. Start the backend:
   ```bash
   cd picpals/backend && npm run dev
   ```

4. Start the frontend:
   ```bash
   cd picpals/frontend && npm start
   ```

The app will be available at `http://localhost:3000`.

## Features

- **Google Sign-In** — authenticate with your Google account
- **Photo Gallery** — upload, view, and delete photos
- **Google Photos Sync** — import photos from your Google Photos library
- **Horse Profiles** — create and manage horse profiles linked to photos
- **Settings** — configure auto-backup and Google Photos sync preferences

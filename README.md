# PicPocket - Enhanced Photo Management Application

PicPocket is a modern photo management application with offline capabilities and cloud backup features.

## Features

- **Local-First Library**: Every photo lives in this browser's IndexedDB, so the app works fully offline
- **Cloud Backup**: Backup photos to Google Drive, Google Photos, OneDrive, and Dropbox
- **Storage Ledger**: One place to see which drive(s) each photo is actually backed up to, and reconcile against what's really in each cloud account
- **AI Photo Understanding**: Every upload is auto-tagged and captioned by Cloudflare Workers AI (image classification + image-to-text), so photos are searchable without manual tagging
- **AI Storage Insights**: Exact-duplicate detection (content-hash based) plus an AI-written summary and recommendations for cleaning up and backing up the library
- **Tagging System**: Organize photos with custom tags (AI-suggested or manual)
- **Location Tagging**: Add geolocation data to photos
- **Album Creation**: Group photos into custom albums
- **Search & Filtering**: Find photos by tag, filename, or location, and filter the gallery by which cloud drive backs each one up
- **Responsive Design**: Works on desktop and mobile devices

## Architecture Improvements

### 1. Persistent Backend Storage
- Replaced in-memory storage with Cloudflare D1 database
- Added proper schema for users, photos, albums, and sessions
- Implemented database migrations

### 2. Enhanced Authentication
- Improved session management with automatic token refresh
- Added proper logout functionality
- Better error handling for authentication failures

### 3. Pagination Support
- Added pagination to photo listings for better performance
- Implemented infinite scrolling in the frontend
- Configurable page sizes

### 4. Search Functionality
- Added full-text search across photos
- Search by tags, filenames, and location data
- Real-time search with debouncing

### 5. File Storage Integration
- Added service layer for file storage management
- Placeholder implementation for R2 integration
- Proper file URL generation

## Setup Instructions

### Prerequisites
- Node.js 18+
- Cloudflare account with Workers and D1 enabled
- Google Cloud Platform account for OAuth

### Backend Setup
1. Create a D1 database:
   ```bash
   wrangler d1 create picpocket
   ```

2. Update `wrangler.toml` with your database ID

3. Apply the database schema:
   ```bash
   wrangler d1 execute picpocket --file=backend/schema.sql
   ```

4. Deploy the worker:
   ```bash
   wrangler deploy
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Update the API endpoint in `frontend/src/services/api.js`

3. Start the development server:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/google` - Google authentication
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify session

### Photos
- `GET /api/photos` - List photos (with pagination)
- `POST /api/photos` - Upload photo
- `GET /api/photos/:id` - Get photo details
- `PUT /api/photos/:id` - Update photo
- `DELETE /api/photos/:id` - Delete photo

### Albums
- `GET /api/albums` - List albums
- `POST /api/albums` - Create album
- `GET /api/albums/:id` - Get album details
- `PUT /api/albums/:id` - Update album
- `DELETE /api/albums/:id` - Delete album
- `POST /api/albums/:id/photos` - Add photo to album

### Search
- `GET /api/search` - Search photos

### AI (Cloudflare Workers AI)
These are unauthenticated, stateless proxies over Workers AI — they don't
touch D1, since the photo library itself lives client-side in IndexedDB.
- `POST /api/ai/analyze` - Auto-tag and caption a photo. Body is the raw
  image bytes (`Content-Type: image/*`); returns `{ tags, caption }`.
- `POST /api/ai/storage-insights` - Turn precomputed library stats (photo
  count, backup coverage per drive, duplicate groups, etc.) into a short
  natural-language summary and recommendations. Falls back to a
  rule-based summary if the `AI` binding isn't configured.

## Development

### Folder Structure
```
picpocket/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   ├── schema.sql
│   └── package.json
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── utils/
│       └── App.js
├── worker.js
├── wrangler.toml
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
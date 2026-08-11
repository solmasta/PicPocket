# PicPocket - Enhanced Photo Management Application

PicPocket is a modern photo management application with offline capabilities and cloud backup features.

## Features

- **Persistent Storage**: Uses Cloudflare D1 database for reliable data storage
- **Offline Support**: IndexedDB for local caching and offline access
- **Cloud Backup**: Backup photos to Google Drive, Google Photos, OneDrive, and Dropbox
- **Tagging System**: Organize photos with custom tags
- **Location Tagging**: Add geolocation data to photos
- **Album Creation**: Group photos into custom albums
- **Search Functionality**: Find photos by tags, names, or locations
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

## Build Process

To build the application for deployment:

```bash
# Make sure you have esbuild installed
npm install

# Run the build script
./build.sh
```

Or build manually:

```bash
# Build frontend
cd frontend
npm install
npm run build
cd ..

# Build worker
npm run build:worker
```

## Deployment

### GitHub Pages
The application is automatically deployed to GitHub Pages on pushes to the main branch.

### Cloudflare Workers
For Cloudflare deployment, see [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

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
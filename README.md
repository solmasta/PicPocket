# PicPocket

A Progressive Web App for managing and backing up photos locally, with Google Drive/Photos, OneDrive, and Dropbox integration.

## Features

- **Photo Upload & Gallery**: Upload photos from your device, organized with tags and location data
- **Cloud Backup**: Automatically backup photos to Google Drive, Google Photos, OneDrive, and Dropbox
- **AI-Powered Insights**: Get storage insights and recommendations using AI
- **Photo Editing**: Apply filters, create collages, and build photo stories
- **Offline Support**: Works offline with IndexedDB storage
- **Privacy-First**: Your photos stay in your browser's local storage

## Tech Stack

- **Frontend**: React, PWA
- **Backend**: Cloudflare Workers
- **Storage**: IndexedDB (local), Google Drive/Photos, OneDrive, Dropbox (cloud)

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install && cd frontend && npm install && cd ../backend && npm install`
3. Copy `.env.example` to `.env` and configure API keys
4. Run locally: `npm run dev` (frontend) and `npm run dev` (backend)

## Documentation

- [Changelog](./CHANGELOG.md)
- [Improvements Summary](./IMPROVEMENTS_SUMMARY.md)

## License

MIT
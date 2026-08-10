-- Migration 001: Initial schema setup

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  fileName TEXT NOT NULL,
  fileType TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  uploadDate TEXT NOT NULL,
  tags TEXT, -- JSON array
  location TEXT, -- JSON object
  cloudBackup TEXT, -- JSON object
  FOREIGN KEY (userId) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS album_photos (
  albumId TEXT NOT NULL,
  photoId TEXT NOT NULL,
  PRIMARY KEY (albumId, photoId),
  FOREIGN KEY (albumId) REFERENCES albums (id),
  FOREIGN KEY (photoId) REFERENCES photos (id)
);
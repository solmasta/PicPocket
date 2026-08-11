// Database service for handling D1 database operations

class DatabaseService {
  constructor(env) {
    this.db = env.DB;
  }

  // User operations
  async createUser(userData) {
    const { id, name, email, avatar, createdAt } = userData;
    const stmt = this.db.prepare(
      'INSERT INTO users (id, name, email, avatar, createdAt) VALUES (?, ?, ?, ?, ?)'
    );
    await stmt.bind(id, name, email, avatar, createdAt).run();
    return userData;
  }

  async getUserById(userId) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const result = await stmt.bind(userId).first();
    return result;
  }

  async getUserByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    const result = await stmt.bind(email).first();
    return result;
  }

  // Session operations
  async createSession(sessionData) {
    const { token, userId, expiresAt } = sessionData;
    const stmt = this.db.prepare(
      'INSERT INTO sessions (token, userId, expiresAt) VALUES (?, ?, ?)'
    );
    await stmt.bind(token, userId, expiresAt).run();
    return sessionData;
  }

  async getSessionByToken(token) {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE token = ?');
    const result = await stmt.bind(token).first();
    return result;
  }

  async deleteSession(token) {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE token = ?');
    await stmt.bind(token).run();
    return { deleted: true };
  }

  async cleanupExpiredSessions() {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE expiresAt < ?');
    await stmt.bind(new Date().toISOString()).run();
    return { cleaned: true };
  }

  // Photo operations
  async createPhoto(photoData) {
    const { id, userId, fileName, fileType, fileSize, uploadDate, tags, location, cloudBackup } = photoData;
    const stmt = this.db.prepare(
      'INSERT INTO photos (id, userId, fileName, fileType, fileSize, uploadDate, tags, location, cloudBackup) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    await stmt.bind(
      id, userId, fileName, fileType, fileSize, uploadDate, 
      tags ? JSON.stringify(tags) : null,
      location ? JSON.stringify(location) : null,
      cloudBackup ? JSON.stringify(cloudBackup) : null
    ).run();
    return photoData;
  }

  async getPhotosByUserId(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const stmt = this.db.prepare(
      'SELECT * FROM photos WHERE userId = ? ORDER BY uploadDate DESC LIMIT ? OFFSET ?'
    );
    const result = await stmt.bind(userId, limit, offset).all();
    
    // Parse JSON fields
    return result.map(photo => ({
      ...photo,
      tags: photo.tags ? JSON.parse(photo.tags) : [],
      location: photo.location ? JSON.parse(photo.location) : null,
      cloudBackup: photo.cloudBackup ? JSON.parse(photo.cloudBackup) : null
    }));
  }

  async getPhotoById(photoId) {
    const stmt = this.db.prepare('SELECT * FROM photos WHERE id = ?');
    const result = await stmt.bind(photoId).first();
    
    if (result) {
      return {
        ...result,
        tags: result.tags ? JSON.parse(result.tags) : [],
        location: result.location ? JSON.parse(result.location) : null,
        cloudBackup: result.cloudBackup ? JSON.parse(result.cloudBackup) : null
      };
    }
    
    return null;
  }

  async updatePhoto(photoId, updates) {
    const fields = [];
    const values = [];
    
    // Build dynamic update query
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'userId') { // Don't allow updating these fields
        fields.push(`${key} = ?`);
        if (key === 'tags' || key === 'location' || key === 'cloudBackup') {
          values.push(JSON.stringify(updates[key]));
        } else {
          values.push(updates[key]);
        }
      }
    });
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    values.push(photoId); // Add photoId for WHERE clause
    
    const stmt = this.db.prepare(
      `UPDATE photos SET ${fields.join(', ')} WHERE id = ?`
    );
    await stmt.bind(...values).run();
    
    return await this.getPhotoById(photoId);
  }

  async deletePhoto(photoId) {
    const stmt = this.db.prepare('DELETE FROM photos WHERE id = ?');
    await stmt.bind(photoId).run();
    return { deleted: true };
  }

  async searchPhotos(userId, query) {
    // Search in fileName, tags, and location fields
    const stmt = this.db.prepare(`
      SELECT * FROM photos 
      WHERE userId = ? 
      AND (
        fileName LIKE ? 
        OR tags LIKE ? 
        OR location LIKE ?
      )
      ORDER BY uploadDate DESC
    `);
    
    const searchTerm = `%${query}%`;
    const result = await stmt.bind(userId, searchTerm, searchTerm, searchTerm).all();
    
    // Parse JSON fields
    return result.map(photo => ({
      ...photo,
      tags: photo.tags ? JSON.parse(photo.tags) : [],
      location: photo.location ? JSON.parse(photo.location) : null,
      cloudBackup: photo.cloudBackup ? JSON.parse(photo.cloudBackup) : null
    }));
  }

  // Album operations
  async createAlbum(albumData) {
    const { id, userId, name, description, createdAt } = albumData;
    const stmt = this.db.prepare(
      'INSERT INTO albums (id, userId, name, description, createdAt) VALUES (?, ?, ?, ?, ?)'
    );
    await stmt.bind(id, userId, name, description, createdAt).run();
    return albumData;
  }

  async getAlbumsByUserId(userId) {
    const stmt = this.db.prepare('SELECT * FROM albums WHERE userId = ? ORDER BY createdAt DESC');
    return await stmt.bind(userId).all();
  }

  async getAlbumById(albumId) {
    const stmt = this.db.prepare('SELECT * FROM albums WHERE id = ?');
    return await stmt.bind(albumId).first();
  }

  async updateAlbum(albumId, updates) {
    const fields = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'userId')
      .map(key => `${key} = ?`);
    const values = Object.values(updates).concat(albumId);
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    const stmt = this.db.prepare(
      `UPDATE albums SET ${fields.join(', ')} WHERE id = ?`
    );
    await stmt.bind(...values).run();
    
    return await this.getAlbumById(albumId);
  }

  async deleteAlbum(albumId) {
    // Delete album-photos relationships first
    const deletePhotosStmt = this.db.prepare('DELETE FROM album_photos WHERE albumId = ?');
    await deletePhotosStmt.bind(albumId).run();
    
    // Delete the album
    const deleteAlbumStmt = this.db.prepare('DELETE FROM albums WHERE id = ?');
    await deleteAlbumStmt.bind(albumId).run();
    
    return { deleted: true };
  }

  async addPhotoToAlbum(albumId, photoId) {
    const stmt = this.db.prepare(
      'INSERT INTO album_photos (albumId, photoId) VALUES (?, ?)'
    );
    await stmt.bind(albumId, photoId).run();
    return { added: true };
  }

  async removePhotoFromAlbum(albumId, photoId) {
    const stmt = this.db.prepare(
      'DELETE FROM album_photos WHERE albumId = ? AND photoId = ?'
    );
    await stmt.bind(albumId, photoId).run();
    return { removed: true };
  }

  async getPhotosInAlbum(albumId) {
    const stmt = this.db.prepare(`
      SELECT p.* FROM photos p
      JOIN album_photos ap ON p.id = ap.photoId
      WHERE ap.albumId = ?
      ORDER BY p.uploadDate DESC
    `);
    const result = await stmt.bind(albumId).all();
    
    // Parse JSON fields
    return result.map(photo => ({
      ...photo,
      tags: photo.tags ? JSON.parse(photo.tags) : [],
      location: photo.location ? JSON.parse(photo.location) : null,
      cloudBackup: photo.cloudBackup ? JSON.parse(photo.cloudBackup) : null
    }));
  }

  async getAlbumPhotoCount(albumId) {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM album_photos WHERE albumId = ?');
    const result = await stmt.bind(albumId).first();
    return result.count;
  }
}

export default DatabaseService;
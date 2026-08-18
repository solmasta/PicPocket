import { json } from '../utils/response.js';

export async function handleAlbums(request) {
  const { env, user } = request;
  const { DB } = env;
  
  try {
    switch (request.method) {
      case 'GET':
        if (request.params && request.params.id) {
          // Get specific album
          const album = await DB.prepare(
            "SELECT * FROM albums WHERE id = ? AND userId = ?"
          ).bind(request.params.id, user.id).first();
          
          if (!album) {
            return json({ error: 'Album not found' }, 404);
          }
          
          // Get photos in album
          const { results: albumPhotos } = await DB.prepare(`
            SELECT p.* FROM photos p
            JOIN album_photos ap ON p.id = ap.photoId
            WHERE ap.albumId = ?
          `).bind(request.params.id).all();
          
          // Parse JSON fields for each photo
          const photos = albumPhotos.map(photo => {
            if (photo.tags) photo.tags = JSON.parse(photo.tags);
            if (photo.location) photo.location = JSON.parse(photo.location);
            if (photo.cloudBackup) photo.cloudBackup = JSON.parse(photo.cloudBackup);
            return photo;
          });
          
          return json({ ...album, photos });
        } else {
          // Get all albums
          const { results } = await DB.prepare(
            "SELECT * FROM albums WHERE userId = ? ORDER BY createdAt DESC"
          ).bind(user.id).all();
          
          return json(results);
        }
        
      case 'POST':
        // Create new album
        const { name, description } = await request.json();
        
        if (!name) {
          return json({ error: 'Album name is required' }, 400);
        }
        
        const albumId = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        
        await DB.prepare(`
          INSERT INTO albums (id, userId, name, description, createdAt)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          albumId,
          user.id,
          name,
          description || '',
          createdAt
        ).run();
        
        const newAlbum = {
          id: albumId,
          userId: user.id,
          name,
          description: description || '',
          createdAt
        };
        
        return json(newAlbum, 201);
        
      case 'PUT':
        // Update album
        if (!request.params || !request.params.id) {
          return json({ error: 'Album ID is required' }, 400);
        }
        
        const updates = await request.json();
        
        const result = await DB.prepare(`
          UPDATE albums 
          SET name = ?, description = ?
          WHERE id = ? AND userId = ?
        `).bind(
          updates.name || null,
          updates.description || '',
          request.params.id,
          user.id
        ).run();
        
        if (result.meta.changes === 0) {
          return json({ error: 'Album not found' }, 404);
        }
        
        const updatedAlbum = await DB.prepare(
          "SELECT * FROM albums WHERE id = ? AND userId = ?"
        ).bind(request.params.id, user.id).first();
        
        return json(updatedAlbum);
        
      case 'DELETE':
        // Delete album (and remove photo associations)
        if (!request.params || !request.params.id) {
          return json({ error: 'Album ID is required' }, 400);
        }
        
        // First delete album-photo associations
        await DB.prepare(
          "DELETE FROM album_photos WHERE albumId = ?"
        ).bind(request.params.id).run();
        
        // Then delete the album
        const deleteResult = await DB.prepare(
          "DELETE FROM albums WHERE id = ? AND userId = ?"
        ).bind(request.params.id, user.id).run();
        
        if (deleteResult.meta.changes === 0) {
          return json({ error: 'Album not found' }, 404);
        }
        
        return json({ message: 'Album deleted successfully' });
        
      case 'POST':
        // Add photo to album (when URL includes photo ID in body)
        if (!request.params || !request.params.id) {
          return json({ error: 'Album ID is required' }, 400);
        }
        
        const { photoId } = await request.json();
        
        if (!photoId) {
          return json({ error: 'Photo ID is required' }, 400);
        }
        
        // Check if photo exists and belongs to user
        const photo = await DB.prepare(
          "SELECT id FROM photos WHERE id = ? AND userId = ?"
        ).bind(photoId, user.id).first();
        
        if (!photo) {
          return json({ error: 'Photo not found' }, 404);
        }
        
        // Check if album exists and belongs to user
        const album = await DB.prepare(
          "SELECT id FROM albums WHERE id = ? AND userId = ?"
        ).bind(request.params.id, user.id).first();
        
        if (!album) {
          return json({ error: 'Album not found' }, 404);
        }
        
        // Add photo to album
        await DB.prepare(`
          INSERT OR IGNORE INTO album_photos (albumId, photoId)
          VALUES (?, ?)
        `).bind(request.params.id, photoId).run();
        
        return json({ message: 'Photo added to album successfully' });
        
      default:
        return json({ error: 'Method not allowed' }, 405);
    }
  } catch (error) {
    console.error('Error handling albums:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}
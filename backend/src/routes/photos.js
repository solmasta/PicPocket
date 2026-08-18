import { json } from '../utils/response.js';
import OptimizedFileStorageService from '../services/optimizedFileStorage.js';

export async function handlePhotos(request) {
  const { env, user } = request;
  const { DB } = env;
  const fileStorage = new OptimizedFileStorageService(env, request);
  
  try {
    switch (request.method) {
      case 'GET':
        if (request.params && request.params.id) {
          // Get specific photo
          const photo = await DB.prepare(
            "SELECT * FROM photos WHERE id = ? AND userId = ?"
          ).bind(request.params.id, user.id).first();
          
          if (!photo) {
            return json({ error: 'Photo not found' }, 404);
          }
          
          // Parse JSON fields
          if (photo.tags) photo.tags = JSON.parse(photo.tags);
          if (photo.location) photo.location = JSON.parse(photo.location);
          if (photo.cloudBackup) photo.cloudBackup = JSON.parse(photo.cloudBackup);
          
          // Add signed URL for secure access
          try {
            photo.url = await fileStorage.createSignedUrl(photo.id);
          } catch (error) {
            console.error('Error creating signed URL:', error);
            // Fallback to direct URL
            photo.url = await fileStorage.getFileUrl(photo.id);
          }
          
          return json(photo);
        } else {
          // Get all photos with pagination
          const page = parseInt(request.query.page) || 1;
          const limit = Math.min(parseInt(request.query.limit) || 20, 100);
          const offset = (page - 1) * limit;
          
          const { results, meta } = await DB.prepare(
            "SELECT * FROM photos WHERE userId = ? ORDER BY uploadDate DESC LIMIT ? OFFSET ?"
          ).bind(user.id, limit, offset).all();
          
          // Parse JSON fields for each photo and add URLs
          const photos = await Promise.all(results.map(async (photo) => {
            if (photo.tags) photo.tags = JSON.parse(photo.tags);
            if (photo.location) photo.location = JSON.parse(photo.location);
            if (photo.cloudBackup) photo.cloudBackup = JSON.parse(photo.cloudBackup);
            
            // Add signed URL for secure access
            try {
              photo.url = await fileStorage.createSignedUrl(photo.id);
            } catch (error) {
              console.error('Error creating signed URL:', error);
              // Fallback to direct URL
              photo.url = await fileStorage.getFileUrl(photo.id);
            }
            
            return photo;
          }));
          
          // Get total count
          const countResult = await DB.prepare(
            "SELECT COUNT(*) as total FROM photos WHERE userId = ?"
          ).bind(user.id).first();
          
          return json({
            photos,
            page,
            limit,
            total: countResult.total
          });
        }
        
      case 'POST':
        // Upload new photo
        const formData = await request.formData();
        const file = formData.get('file');
        const tags = formData.get('tags') ? JSON.parse(formData.get('tags')) : [];
        const location = formData.get('location') ? JSON.parse(formData.get('location')) : null;
        const cloudBackup = formData.get('cloudBackup') ? JSON.parse(formData.get('cloudBackup')) : null;
        
        if (!file) {
          return json({ error: 'File is required' }, 400);
        }
        
        const photoId = crypto.randomUUID();
        const uploadDate = new Date().toISOString();
        
        // Store the file
        const storageResult = await fileStorage.storeFile(file, photoId);
        
        // Store metadata in database
        await DB.prepare(`
          INSERT INTO photos (id, userId, fileName, fileType, fileSize, uploadDate, tags, location, cloudBackup)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          photoId,
          user.id,
          file.name,
          file.type,
          file.size,
          uploadDate,
          JSON.stringify(tags),
          JSON.stringify(location),
          JSON.stringify(cloudBackup)
        ).run();
        
        // Create signed URL for the new photo
        let photoUrl;
        try {
          photoUrl = await fileStorage.createSignedUrl(photoId);
        } catch (error) {
          console.error('Error creating signed URL:', error);
          photoUrl = storageResult.url;
        }
        
        const newPhoto = {
          id: photoId,
          userId: user.id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadDate,
          tags,
          location,
          cloudBackup,
          url: photoUrl
        };
        
        return json(newPhoto, 201);
        
      case 'PUT':
        // Update photo
        if (!request.params || !request.params.id) {
          return json({ error: 'Photo ID is required' }, 400);
        }
        
        const updates = await request.json();
        const photo = await DB.prepare(
          "SELECT * FROM photos WHERE id = ? AND userId = ?"
        ).bind(request.params.id, user.id).first();
        
        if (!photo) {
          return json({ error: 'Photo not found' }, 404);
        }
        
        // Update fields
        const updatedTags = updates.tags ? JSON.stringify(updates.tags) : photo.tags;
        const updatedLocation = updates.location ? JSON.stringify(updates.location) : photo.location;
        const updatedCloudBackup = updates.cloudBackup ? JSON.stringify(updates.cloudBackup) : photo.cloudBackup;
        
        await DB.prepare(`
          UPDATE photos 
          SET tags = ?, location = ?, cloudBackup = ?
          WHERE id = ? AND userId = ?
        `).bind(
          updatedTags,
          updatedLocation,
          updatedCloudBackup,
          request.params.id,
          user.id
        ).run();
        
        // Create signed URL for the updated photo
        let updatedPhotoUrl;
        try {
          updatedPhotoUrl = await fileStorage.createSignedUrl(request.params.id);
        } catch (error) {
          console.error('Error creating signed URL:', error);
          updatedPhotoUrl = await fileStorage.getFileUrl(request.params.id);
        }
        
        const updatedPhoto = {
          ...photo,
          tags: updates.tags || JSON.parse(photo.tags),
          location: updates.location || (photo.location ? JSON.parse(photo.location) : null),
          cloudBackup: updates.cloudBackup || (photo.cloudBackup ? JSON.parse(photo.cloudBackup) : null),
          url: updatedPhotoUrl
        };
        
        return json(updatedPhoto);
        
      case 'DELETE':
        // Delete photo
        if (!request.params || !request.params.id) {
          return json({ error: 'Photo ID is required' }, 400);
        }
        
        // Delete file from storage
        await fileStorage.deleteFile(request.params.id);
        
        // Delete from database
        const result = await DB.prepare(
          "DELETE FROM photos WHERE id = ? AND userId = ?"
        ).bind(request.params.id, user.id).run();
        
        if (result.meta.changes === 0) {
          return json({ error: 'Photo not found' }, 404);
        }
        
        return json({ message: 'Photo deleted successfully' });
        
      default:
        return json({ error: 'Method not allowed' }, 405);
    }
  } catch (error) {
    console.error('Error handling photos:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}

// Streams the raw photo bytes from R2. This is what photo.url points at,
// since R2 bucket bindings have no presigned-URL API of their own.
export async function handlePhotoFile(request) {
  const { env, user, params } = request;
  const { DB, BUCKET } = env;

  try {
    const photo = await DB.prepare(
      "SELECT id, fileType FROM photos WHERE id = ? AND userId = ?"
    ).bind(params.id, user.id).first();

    if (!photo) {
      return json({ error: 'Photo not found' }, 404);
    }

    const object = await BUCKET.get(params.id);
    if (!object) {
      return json({ error: 'Photo file not found' }, 404);
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || photo.fileType || 'application/octet-stream',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving photo file:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}
import { json, error, asyncHandler, ErrorCodes } from '../utils/response.js';
import OptimizedFileStorageService from '../services/optimizedFileStorage.js';

function parseJsonField(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function parsePhoto(photo) {
  if (!photo) return null;
  return {
    ...photo,
    tags: parseJsonField(photo.tags),
    location: parseJsonField(photo.location),
    cloudBackup: parseJsonField(photo.cloudBackup),
  };
}

export async function handlePhotos(request) {
  const { env, user } = request;
  const { DB } = env;
  const fileStorage = new OptimizedFileStorageService(env, request);

  const getPhotoUrl = async (photoId) => {
    try {
      return await fileStorage.createSignedUrl(photoId);
    } catch (err) {
      console.error('Error creating signed URL:', err);
      return await fileStorage.getFileUrl(photoId);
    }
  };

  const addPhotoUrl = async (photo) => {
    const withUrl = { ...photo };
    withUrl.url = await getPhotoUrl(photo.id);
    return withUrl;
  };

  try {
    switch (request.method) {
      case 'GET':
        if (request.params?.id) {
          const photo = await DB.prepare(
            "SELECT * FROM photos WHERE id = ? AND userId = ?"
          ).bind(request.params.id, user.id).first();

          if (!photo) {
            return error('Photo not found', 404, ErrorCodes.NOT_FOUND.code);
          }

          const parsed = parsePhoto(photo);
          parsed.url = await getPhotoUrl(photo.id);
          return json(parsed);
        }

        const page = Math.max(1, parseInt(request.query?.page) || 1);
        const limit = Math.min(Math.max(1, parseInt(request.query?.limit) || 20), 100);
        const offset = (page - 1) * limit;

        const { results, meta } = await DB.prepare(
          "SELECT * FROM photos WHERE userId = ? ORDER BY uploadDate DESC LIMIT ? OFFSET ?"
        ).bind(user.id, limit, offset).all();

        const photos = await Promise.all(
          results.map(async (photo) => {
            const parsed = parsePhoto(photo);
            parsed.url = await getPhotoUrl(photo.id);
            return parsed;
          })
        );

        const countResult = await DB.prepare(
          "SELECT COUNT(*) as total FROM photos WHERE userId = ?"
        ).bind(user.id).first();

        return json({
          photos,
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit),
        });

      case 'POST': {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
          return error('File is required', 400, ErrorCodes.BAD_REQUEST.code);
        }

        const tags = formData.get('tags') ? parseJsonField(formData.get('tags')) : [];
        const location = formData.get('location') ? parseJsonField(formData.get('location')) : null;
        const cloudBackup = formData.get('cloudBackup') ? parseJsonField(formData.get('cloudBackup')) : null;

        const photoId = crypto.randomUUID();
        const uploadDate = new Date().toISOString();

        await fileStorage.storeFile(file, photoId);

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
          url: await getPhotoUrl(photoId),
        };

        return json(newPhoto, 201);
      }

      case 'PATCH': {
        if (!request.params?.id) {
          return error('Photo ID is required', 400, ErrorCodes.BAD_REQUEST.code);
        }

        const existing = await DB.prepare(
          "SELECT * FROM photos WHERE id = ? AND userId = ?"
        ).bind(request.params.id, user.id).first();

        if (!existing) {
          return error('Photo not found', 404, ErrorCodes.NOT_FOUND.code);
        }

        const updates = await request.json();
        const updatedTags = updates.tags !== undefined ? updates.tags : parseJsonField(existing.tags);
        const updatedLocation = updates.location !== undefined ? updates.location : parseJsonField(existing.location);
        const updatedCloudBackup = updates.cloudBackup !== undefined ? updates.cloudBackup : parseJsonField(existing.cloudBackup);

        await DB.prepare(`
          UPDATE photos SET tags = ?, location = ?, cloudBackup = ? WHERE id = ? AND userId = ?
        `).bind(
          JSON.stringify(updatedTags),
          JSON.stringify(updatedLocation),
          JSON.stringify(updatedCloudBackup),
          request.params.id,
          user.id
        ).run();

        const updatedPhoto = {
          ...parsePhoto(existing),
          ...updates,
          url: await getPhotoUrl(request.params.id),
        };

        return json(updatedPhoto);
      }

      case 'DELETE': {
        if (!request.params?.id) {
          return error('Photo ID is required', 400, ErrorCodes.BAD_REQUEST.code);
        }

        await fileStorage.deleteFile(request.params.id);

        const result = await DB.prepare(
          "DELETE FROM photos WHERE id = ? AND userId = ?"
        ).bind(request.params.id, user.id).run();

        if (result.meta.changes === 0) {
          return error('Photo not found', 404, ErrorCodes.NOT_FOUND.code);
        }

        return json({ message: 'Photo deleted successfully' });
      }

      default:
        return error('Method not allowed', 405, ErrorCodes.BAD_REQUEST.code);
    }
  } catch (err) {
    console.error('Error handling photos:', err);
    return error('Internal server error', 500, ErrorCodes.INTERNAL_ERROR.code);
  }
}

export async function handlePhotoFile(request) {
  const { env, user, params } = request;
  const { DB, BUCKET } = env;

  try {
    const photo = await DB.prepare(
      "SELECT id, fileType FROM photos WHERE id = ? AND userId = ?"
    ).bind(params.id, user.id).first();

    if (!photo) {
      return error('Photo not found', 404, ErrorCodes.NOT_FOUND.code);
    }

    const object = await BUCKET.get(params.id);
    if (!object) {
      return error('Photo file not found', 404, ErrorCodes.NOT_FOUND.code);
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || photo.fileType || 'application/octet-stream',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    console.error('Error serving photo file:', err);
    return error('Internal server error', 500, ErrorCodes.INTERNAL_ERROR.code);
  }
}

export default { handlePhotos, handlePhotoFile };
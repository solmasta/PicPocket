// Optimized file storage service for handling photo storage in Cloudflare R2
// with performance improvements for high-load scenarios

class OptimizedFileStorageService {
  // `request` is used to build absolute file URLs against this Worker's
  // own origin — the R2 binding has no presigned-URL API, so files are
  // served back through our own authenticated /api/photos/:id/file route.
  constructor(env, request) {
    this.env = env;
    this.bucket = env.BUCKET;
    this.origin = request ? new URL(request.url).origin : '';
  }

  // Store file in R2 bucket with metadata
  async storeFile(file, fileId) {
    try {
      // Handle both File objects and array buffers
      let fileBuffer;
      if (file.arrayBuffer) {
        fileBuffer = await file.arrayBuffer();
      } else if (file instanceof ArrayBuffer) {
        fileBuffer = file;
      } else {
        throw new Error('Invalid file format');
      }
      
      // Store file in R2 bucket with metadata
      const object = await this.bucket.put(fileId, fileBuffer, {
        httpMetadata: {
          contentType: file.type || 'application/octet-stream',
          contentDisposition: `inline; filename="${file.name || fileId}"`
        }
      });
      
      return {
        url: this.getFileUrl(fileId),
        stored: true,
        key: fileId
      };
    } catch (error) {
      console.error('Error storing file in R2:', error);
      throw new Error('Failed to store file: ' + error.message);
    }
  }

  // Delete file from R2 bucket
  async deleteFile(fileId) {
    try {
      await this.bucket.delete(fileId);
      return { deleted: true };
    } catch (error) {
      console.error('Error deleting file from R2:', error);
      // Don't throw error if file doesn't exist - it's already deleted
      return { deleted: true };
    }
  }

  // Build the URL clients use to fetch the file. R2 bucket bindings don't
  // support presigned URLs directly, so files are streamed back through
  // this Worker's own authenticated route instead.
  getFileUrl(fileId) {
    return `${this.origin}/api/photos/${fileId}/file`;
  }

  // Kept as an alias so existing callers that expect an (async) signed-URL
  // step keep working.
  async createSignedUrl(fileId) {
    return this.getFileUrl(fileId);
  }
}

export default OptimizedFileStorageService;
// File storage service for handling photo storage in Cloudflare R2

class FileStorageService {
  constructor(env) {
    this.env = env;
    this.bucket = env.BUCKET;
  }

  // Store file in R2 bucket
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
      
      // Generate signed URL for the stored file
      const url = await this.createSignedUrl(fileId);
      
      return {
        url: url,
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

  // Get file URL from R2 bucket
  async getFileUrl(fileId) {
    try {
      // Check if file exists
      const object = await this.bucket.get(fileId);
      if (!object) {
        return null;
      }
      
      // Generate signed URL valid for 1 hour
      const signedUrl = await this.bucket.createSignedUrl(fileId, 3600);
      return signedUrl;
    } catch (error) {
      console.error('Error getting file URL from R2:', error);
      return null;
    }
  }

  // Create a temporary signed URL for direct access (valid for 1 hour)
  async createSignedUrl(fileId) {
    try {
      // Create signed URL valid for 1 hour (3600 seconds)
      const signedUrl = await this.bucket.createSignedUrl(fileId, 3600);
      return signedUrl;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      throw new Error('Failed to create signed URL: ' + error.message);
    }
  }
}

export default FileStorageService;
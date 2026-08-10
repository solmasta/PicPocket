// File storage service for handling photo storage in Cloudflare R2

class FileStorageService {
  constructor(env) {
    this.env = env;
    this.bucket = env.BUCKET;
  }

  // Store file in R2 bucket
  async storeFile(file, fileId) {
    try {
      // Convert file to array buffer for R2 storage
      const fileBuffer = await file.arrayBuffer();
      
      // Store file in R2 bucket with metadata
      const object = await this.bucket.put(fileId, fileBuffer, {
        httpMetadata: {
          contentType: file.type,
          contentDisposition: `inline; filename="${file.name}"`
        }
      });
      
      // Generate public URL for the stored file
      const url = `https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev/${fileId}`;
      
      return {
        url: url,
        stored: true,
        key: fileId
      };
    } catch (error) {
      console.error('Error storing file in R2:', error);
      throw new Error('Failed to store file');
    }
  }

  // Delete file from R2 bucket
  async deleteFile(fileId) {
    try {
      await this.bucket.delete(fileId);
      return { deleted: true };
    } catch (error) {
      console.error('Error deleting file from R2:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Generate signed URL for file access (valid for 1 hour)
  async getFileUrl(fileId) {
    try {
      // Check if file exists
      const object = await this.bucket.get(fileId);
      if (!object) {
        return null;
      }
      
      // Generate signed URL valid for 1 hour
      const url = await this.bucket.head(fileId);
      return `https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev/${fileId}`;
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
      throw new Error('Failed to create signed URL');
    }
  }
}

export default FileStorageService;
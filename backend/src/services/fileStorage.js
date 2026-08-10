// File storage service for handling photo storage in Cloudflare R2

class FileStorageService {
  constructor(env) {
    this.env = env;
  }

  // Store a file in R2 storage
  async storeFile(file, fileId) {
    try {
      // Convert file to array buffer for R2 storage
      const fileBuffer = await file.arrayBuffer();
      
      // Store file in R2 bucket
      await this.env.R2.put(fileId, fileBuffer, {
        httpMetadata: {
          'content-type': file.type,
          'content-length': file.size
        }
      });
      
      // Generate public URL for the file
      const url = `${this.env.R2_PUBLIC_URL}/${fileId}`;
      
      return {
        url,
        stored: true
      };
    } catch (error) {
      console.error('Failed to store file in R2:', error);
      throw new Error('Failed to store file');
    }
  }

  // Delete a file from R2 storage
  async deleteFile(fileId) {
    try {
      await this.env.R2.delete(fileId);
      return { deleted: true };
    } catch (error) {
      console.error('Failed to delete file from R2:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Generate a signed URL for file access (for private files)
  async getFileUrl(fileId) {
    try {
      // For public files, return direct URL
      if (this.env.R2_PUBLIC_URL) {
        return `${this.env.R2_PUBLIC_URL}/${fileId}`;
      }
      
      // For private files, generate signed URL
      const url = await this.env.R2.createSignedUrl(fileId, { expiry: 3600 }); // 1 hour expiry
      return url;
    } catch (error) {
      console.error('Failed to generate file URL:', error);
      // Fallback to placeholder if URL generation fails
      return `https://placehold.co/300x300?text=${encodeURIComponent(fileId)}`;
    }
  }

  // Get file metadata
  async getFileMetadata(fileId) {
    try {
      const obj = await this.env.R2.head(fileId);
      if (!obj) {
        return null;
      }
      
      return {
        key: obj.key,
        size: obj.size,
        etag: obj.etag,
        uploaded: obj.uploaded,
        httpMetadata: obj.httpMetadata
      };
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      return null;
    }
  }
}

export default FileStorageService;
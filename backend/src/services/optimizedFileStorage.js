// Optimized file storage service for handling photo storage in Cloudflare R2
// with performance improvements for high-load scenarios

class OptimizedFileStorageService {
  constructor(env) {
    this.env = env;
    this.bucket = env.BUCKET;
    // Cache for signed URLs to reduce repeated signing operations
    this.urlCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
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
      
      // Invalidate cache for this file
      this.urlCache.delete(fileId);
      
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
      // Invalidate cache for this file
      this.urlCache.delete(fileId);
      return { deleted: true };
    } catch (error) {
      console.error('Error deleting file from R2:', error);
      // Don't throw error if file doesn't exist - it's already deleted
      return { deleted: true };
    }
  }

  // Get file URL from R2 bucket with caching
  async getFileUrl(fileId) {
    try {
      // Check cache first
      const cached = this.urlCache.get(fileId);
      if (cached && Date.now() < cached.expiry) {
        return cached.url;
      }
      
      // Check if file exists
      const object = await this.bucket.get(fileId);
      if (!object) {
        return null;
      }
      
      // Generate signed URL valid for 1 hour
      const signedUrl = await this.bucket.createSignedUrl(fileId, 3600);
      
      // Cache the URL
      this.urlCache.set(fileId, {
        url: signedUrl,
        expiry: Date.now() + this.cacheExpiry
      });
      
      return signedUrl;
    } catch (error) {
      console.error('Error getting file URL from R2:', error);
      return null;
    }
  }

  // Create a temporary signed URL for direct access with caching
  async createSignedUrl(fileId) {
    try {
      // Check cache first
      const cached = this.urlCache.get(fileId);
      if (cached && Date.now() < cached.expiry) {
        return cached.url;
      }
      
      // Create signed URL valid for 1 hour (3600 seconds)
      const signedUrl = await this.bucket.createSignedUrl(fileId, 3600);
      
      // Cache the URL
      this.urlCache.set(fileId, {
        url: signedUrl,
        expiry: Date.now() + this.cacheExpiry
      });
      
      return signedUrl;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      throw new Error('Failed to create signed URL: ' + error.message);
    }
  }

  // Clear URL cache (useful when files are updated)
  clearCache() {
    this.urlCache.clear();
  }

  // Batch create signed URLs for multiple files
  async createSignedUrls(fileIds) {
    try {
      const urls = {};
      const uncachedFileIds = [];
      
      // Check cache for each file
      for (const fileId of fileIds) {
        const cached = this.urlCache.get(fileId);
        if (cached && Date.now() < cached.expiry) {
          urls[fileId] = cached.url;
        } else {
          uncachedFileIds.push(fileId);
        }
      }
      
      // For uncached files, we still need to create individual URLs
      // In a real implementation, you might want to batch these
      for (const fileId of uncachedFileIds) {
        try {
          const signedUrl = await this.createSignedUrl(fileId);
          urls[fileId] = signedUrl;
        } catch (error) {
          console.error(`Error creating signed URL for ${fileId}:`, error);
          urls[fileId] = null;
        }
      }
      
      return urls;
    } catch (error) {
      console.error('Error creating batch signed URLs:', error);
      throw new Error('Failed to create batch signed URLs: ' + error.message);
    }
  }
}

export default OptimizedFileStorageService;
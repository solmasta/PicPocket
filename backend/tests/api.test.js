// Mock Cloudflare environment
const mockEnv = {
  DB: {
    prepare: jest.fn().mockReturnThis(),
    bind: jest.fn().mockReturnThis(),
    first: jest.fn(),
    all: jest.fn(),
    run: jest.fn()
  }
};

// Mock photo data
const mockPhoto = {
  id: 'photo1',
  userId: 'user1',
  fileName: 'test.jpg',
  fileType: 'image/jpeg',
  fileSize: 1024,
  uploadDate: '2023-01-01T00:00:00.000Z',
  tags: '["test", "photo"]',
  location: '{"latitude": 0, "longitude": 0}',
  cloudBackup: '{"google": true}'
};

describe('Photo API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch photos with pagination', async () => {
    const mockResults = {
      results: [mockPhoto],
      meta: { count: 1 }
    };
    
    mockEnv.DB.all.mockResolvedValue(mockResults);
    
    // Import the photos handler
    const { handlePhotos } = await import('../src/routes/photos.js');
    
    const mockRequest = {
      method: 'GET',
      query: { page: '1', limit: '20' },
      env: mockEnv,
      user: { id: 'user1' }
    };
    
    const response = await handlePhotos(mockRequest);
    const data = await response.json();
    
    expect(data.photos).toHaveLength(1);
    expect(data.page).toBe(1);
    expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
      "SELECT * FROM photos WHERE userId = ? ORDER BY uploadDate DESC LIMIT ? OFFSET ?"
    );
  });

  test('should upload a new photo', async () => {
    mockEnv.DB.run.mockResolvedValue({ success: true });
    
    // Import the photos handler
    const { handlePhotos } = await import('../src/routes/photos.js');
    
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockFormData = new FormData();
    mockFormData.append('file', mockFile);
    mockFormData.append('tags', '["test"]');
    
    const mockRequest = {
      method: 'POST',
      formData: async () => mockFormData,
      env: mockEnv,
      user: { id: 'user1' }
    };
    
    const response = await handlePhotos(mockRequest);
    const data = await response.json();
    
    expect(data.fileName).toBe('test.jpg');
    expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO photos")
    );
  });

  test('should delete a photo', async () => {
    mockEnv.DB.run.mockResolvedValue({ meta: { changes: 1 } });
    
    // Import the photos handler
    const { handlePhotos } = await import('../src/routes/photos.js');
    
    const mockRequest = {
      method: 'DELETE',
      params: { id: 'photo1' },
      env: mockEnv,
      user: { id: 'user1' }
    };
    
    const response = await handlePhotos(mockRequest);
    const data = await response.json();
    
    expect(data.message).toBe('Photo deleted successfully');
    expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
      "DELETE FROM photos WHERE id = ? AND userId = ?"
    );
  });
});
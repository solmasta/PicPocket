import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import { handleAnalyzePhoto, handleStorageInsights } from '../src/routes/ai.js';

function buildInsightsStats(overrides = {}) {
  return {
    totalPhotos: 0,
    totalBytes: 0,
    backedUpNowhere: 0,
    perProvider: { googleDrive: 0, googlePhotos: 0, oneDrive: 0, dropbox: 0 },
    duplicateGroups: 0,
    duplicateWastedBytes: 0,
    topTags: [],
    ...overrides,
  };
}

describe('handleAnalyzePhoto', () => {
  test('returns tags and a caption from Workers AI', async () => {
    const mockAI = {
      run: jest.fn((model) => {
        if (model.includes('resnet')) {
          return Promise.resolve([
            { label: 'Shetland sheepdog, Shetland sheep dog, Shetland', score: 0.82 },
            { label: 'seashore', score: 0.05 }, // below confidence floor
          ]);
        }
        return Promise.resolve({ description: 'A dog standing on the beach.' });
      }),
    };

    const request = new Request('http://localhost/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg' },
      body: new Uint8Array([1, 2, 3, 4]),
    });
    request.env = { AI: mockAI };

    const response = await handleAnalyzePhoto(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tags).toEqual(['shetland-sheepdog']);
    expect(data.caption).toBe('A dog standing on the beach.');
  });

  test('returns 503 when the AI binding is not configured', async () => {
    const request = new Request('http://localhost/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg' },
      body: new Uint8Array([1]),
    });
    request.env = {};

    const response = await handleAnalyzePhoto(request);
    expect(response.status).toBe(503);
  });

  test('rejects a non-image request body', async () => {
    const request = new Request('http://localhost/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    request.env = { AI: { run: jest.fn() } };

    const response = await handleAnalyzePhoto(request);
    expect(response.status).toBe(400);
  });

  test('returns 502 when both classification and captioning fail', async () => {
    const mockAI = { run: jest.fn().mockRejectedValue(new Error('model unavailable')) };
    const request = new Request('http://localhost/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg' },
      body: new Uint8Array([1, 2, 3]),
    });
    request.env = { AI: mockAI };

    const response = await handleAnalyzePhoto(request);
    expect(response.status).toBe(502);
  });
});

describe('handleStorageInsights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns the AI-generated summary when the model responds with valid JSON', async () => {
    const mockAI = {
      run: jest.fn().mockResolvedValue({
        response: JSON.stringify({ summary: 'All good.', recommendations: ['Do X.'] }),
      }),
    };
    const request = new Request('http://localhost/api/ai/storage-insights', {
      method: 'POST',
      body: JSON.stringify(buildInsightsStats({ totalPhotos: 3, totalBytes: 3000, backedUpNowhere: 1 })),
    });
    request.env = { AI: mockAI };

    const response = await handleStorageInsights(request);
    const data = await response.json();

    expect(data).toEqual({ summary: 'All good.', recommendations: ['Do X.'], source: 'ai' });
  });

  test('falls back to a rule-based summary when the AI binding is missing', async () => {
    const request = new Request('http://localhost/api/ai/storage-insights', {
      method: 'POST',
      body: JSON.stringify(buildInsightsStats()),
    });
    request.env = {};

    const response = await handleStorageInsights(request);
    const data = await response.json();

    expect(data.source).toBe('rules');
    expect(data.summary).toMatch(/haven't uploaded/i);
  });

  test('falls back to a rule-based summary when the model response is not valid JSON', async () => {
    const mockAI = { run: jest.fn().mockResolvedValue({ response: 'not json at all' }) };
    const request = new Request('http://localhost/api/ai/storage-insights', {
      method: 'POST',
      body: JSON.stringify(buildInsightsStats({ totalPhotos: 5, totalBytes: 5000, backedUpNowhere: 5 })),
    });
    request.env = { AI: mockAI };

    const response = await handleStorageInsights(request);
    const data = await response.json();

    expect(data.source).toBe('rules');
    expect(data.summary).toContain('5 photos');
  });

  test('falls back to rules when the model call throws', async () => {
    const mockAI = { run: jest.fn().mockRejectedValue(new Error('boom')) };
    const request = new Request('http://localhost/api/ai/storage-insights', {
      method: 'POST',
      body: JSON.stringify(buildInsightsStats({ totalPhotos: 1, totalBytes: 100 })),
    });
    request.env = { AI: mockAI };

    const response = await handleStorageInsights(request);
    const data = await response.json();
    expect(data.source).toBe('rules');
  });

  test('rejects an invalid JSON body', async () => {
    const request = new Request('http://localhost/api/ai/storage-insights', {
      method: 'POST',
      body: 'not json',
    });
    request.env = { AI: { run: jest.fn() } };

    const response = await handleStorageInsights(request);
    expect(response.status).toBe(400);
  });
});

const request = require('supertest');
const app = require('../server');

describe('Health Check', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth Routes', () => {
  it('GET /api/auth/me without token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Photos Routes', () => {
  it('GET /api/photos without token returns 401', async () => {
    const res = await request(app).get('/api/photos');
    expect(res.status).toBe(401);
  });

  it('POST /api/photos/upload without token returns 401', async () => {
    const res = await request(app).post('/api/photos/upload');
    expect(res.status).toBe(401);
  });
});

describe('Albums Routes', () => {
  it('GET /api/albums without token returns 401', async () => {
    const res = await request(app).get('/api/albums');
    expect(res.status).toBe(401);
  });
});

describe('Tags Routes', () => {
  it('GET /api/tags without token returns 401', async () => {
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(401);
  });

  it('GET /api/tags/search without token returns 401', async () => {
    const res = await request(app).get('/api/tags/search?tag=nature');
    expect(res.status).toBe(401);
  });
});

describe('AI Routes', () => {
  it('POST /api/ai/autotag without token returns 401', async () => {
    const res = await request(app).post('/api/ai/autotag').send({ imageData: 'test' });
    expect(res.status).toBe(401);
  });
});

describe('404 Handler', () => {
  it('unknown route returns 404', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.status).toBe(404);
  });
});

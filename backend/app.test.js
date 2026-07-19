const request = require('supertest');
const app = require('./app');

describe('GET /api/settings', () => {
  it('returns default settings', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      googlePhotos: false,
      googleDrive: false,
      autoBackup: false,
      horseProfile: {}
    });
  });
});

describe('PUT /api/settings', () => {
  it('updates settings', async () => {
    const res = await request(app).put('/api/settings').send({
      googlePhotos: true,
      googleDrive: false,
      autoBackup: true,
      horseProfile: { name: 'Spirit', breed: 'Mustang' }
    });
    expect(res.status).toBe(200);
    expect(res.body.googlePhotos).toBe(true);
    expect(res.body.autoBackup).toBe(true);
    expect(res.body.horseProfile).toEqual({ name: 'Spirit', breed: 'Mustang' });
  });

  it('coerces non-object horseProfile to empty object', async () => {
    const res = await request(app).put('/api/settings').send({
      googlePhotos: false,
      googleDrive: false,
      autoBackup: false,
      horseProfile: null
    });
    expect(res.status).toBe(200);
    expect(res.body.horseProfile).toEqual({});
  });
});

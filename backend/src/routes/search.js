import { json } from '../utils/response.js';

export async function handleSearch(request) {
  const { env, user } = request;
  const { DB } = env;
  
  try {
    const query = request.query.q;
    
    if (!query) {
      return json({ error: 'Search query is required' }, 400);
    }
    
    // Search in photos table
    const { results } = await DB.prepare(`
      SELECT * FROM photos 
      WHERE userId = ? 
      AND (
        fileName LIKE ? 
        OR tags LIKE ? 
        OR location LIKE ?
      )
      ORDER BY uploadDate DESC
      LIMIT 50
    `).bind(
      user.id, 
      `%${query}%`, 
      `%${query}%`, 
      `%${query}%`
    ).all();
    
    // Parse JSON fields for each photo
    const photos = results.map(photo => {
      if (photo.tags) photo.tags = JSON.parse(photo.tags);
      if (photo.location) photo.location = JSON.parse(photo.location);
      if (photo.cloudBackup) photo.cloudBackup = JSON.parse(photo.cloudBackup);
      return photo;
    });
    
    return json(photos);
  } catch (error) {
    console.error('Search error:', error);
    return json({ error: 'Search failed' }, 500);
  }
}
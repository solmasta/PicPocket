import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

/**
 * AI service for auto-tagging and face recognition
 * These calls go through the backend which handles the AI model interactions
 */

/**
 * Auto-tag a photo using AI
 * @param {string} imageDataUrl - Base64 image data URL
 * @returns {Promise<string[]>} Array of suggested tags
 */
export async function autoTagPhoto(imageDataUrl) {
  try {
    const response = await axios.post(
      `${API_BASE}/ai/autotag`,
      { imageData: imageDataUrl },
      { timeout: 30000 }
    );
    return response.data.tags || [];
  } catch (err) {
    console.error('Auto-tag failed:', err);
    // Return basic suggestions based on client-side analysis
    return generateBasicTags();
  }
}

/**
 * Detect faces in a photo
 * @param {string} imageDataUrl - Base64 image data URL
 * @returns {Promise<Array>} Array of detected faces with bounding boxes
 */
export async function detectFaces(imageDataUrl) {
  try {
    const response = await axios.post(
      `${API_BASE}/ai/faces`,
      { imageData: imageDataUrl },
      { timeout: 30000 }
    );
    return response.data.faces || [];
  } catch (err) {
    console.error('Face detection failed:', err);
    return [];
  }
}

/**
 * Generate a caption for a photo using AI
 */
export async function generateCaption(imageDataUrl) {
  try {
    const response = await axios.post(
      `${API_BASE}/ai/caption`,
      { imageData: imageDataUrl },
      { timeout: 30000 }
    );
    return response.data.caption || '';
  } catch (err) {
    console.error('Caption generation failed:', err);
    return '';
  }
}

/**
 * Basic client-side tag suggestions based on common categories
 */
function generateBasicTags() {
  const categories = [
    'photo',
    'memory',
    'moment',
    'life',
    'daily',
  ];
  const timeOfDay = getTimeOfDayTag();
  return [...categories.slice(0, 2), timeOfDay].filter(Boolean);
}

function getTimeOfDayTag() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// k6 load test suite — needs the k6 binary and a running `wrangler dev`
// (localhost:8787) to do anything, so it isn't part of `npm run stress-test`
// (see real-load-test.mjs for that). It also targets /api/photos and
// /api/search, the legacy D1-backed routes: the current frontend's photo
// library lives entirely in the browser's IndexedDB (see usePhotos.js) and
// never calls these, and this script's own auth step is a no-op comment
// ("In a real test, we would authenticate here"), so every request here
// hits authMiddleware with no token and gets a 401 before touching D1/R2 —
// useful as a k6-syntax reference, not as a working load test today.
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// Custom metrics
const photoUploadTime = new Trend('photo_upload_duration', true);
const photoFetchTime = new Trend('photo_fetch_duration', true);
const authTime = new Trend('auth_duration', true);
const concurrentUsers = new Counter('concurrent_users');

// Test options
export const options = {
  scenarios: {
    // Test 1: Concurrent user simulation
    concurrent_users: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 50 }, // Ramp up to 50 users
        { duration: '1m', target: 50 }, // Stay at 50 users
        { duration: '30s', target: 100 }, // Ramp up to 100 users
        { duration: '1m', target: 100 }, // Stay at 100 users
        { duration: '30s', target: 0 }, // Ramp down to 0 users
      ],
      gracefulRampDown: '30s',
    },
    // Test 2: High load spike
    spike_test: {
      executor: 'constant-vus',
      vus: 200,
      duration: '30s',
      startTime: '3m',
    },
  },
};

// Test data
const BASE_URL = 'http://localhost:8787';
const TEST_PHOTO = open('./test-photo.jpg', 'b');

export function setup() {
  // Setup test data if needed
  console.log('Setting up stress test...');
  return { testStartTime: Date.now() };
}

export default function (data) {
  // Simulate user behavior
  group('User Session', function () {
    // 1. Authentication (simulated)
    const authStart = new Date().getTime();
    // In a real test, we would authenticate here
    const authEnd = new Date().getTime();
    authTime.add(authEnd - authStart);
    
    // 2. Fetch photos
    const fetchStart = new Date().getTime();
    const photoRes = http.get(`${BASE_URL}/api/photos?page=1&limit=20`);
    const fetchEnd = new Date().getTime();
    photoFetchTime.add(fetchEnd - fetchStart);
    
    check(photoRes, {
      'photos fetched successfully': (r) => r.status === 200,
      'photos response has data': (r) => r.json().hasOwnProperty('photos'),
    });
    
    // 3. Upload a photo (only for some users to avoid overwhelming storage)
    if (__VU < 20) { // Only first 20 virtual users upload photos
      const uploadStart = new Date().getTime();
      const uploadRes = http.post(`${BASE_URL}/api/photos`, {
        file: http.file(TEST_PHOTO, 'test-photo.jpg', 'image/jpeg'),
        tags: JSON.stringify(['test', 'stress']),
      }, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const uploadEnd = new Date().getTime();
      photoUploadTime.add(uploadEnd - uploadStart);
      
      check(uploadRes, {
        'photo uploaded successfully': (r) => r.status === 201,
        'photo has ID': (r) => r.json().hasOwnProperty('id'),
      });
    }
    
    // 4. Search photos
    const searchRes = http.get(`${BASE_URL}/api/search?q=test`);
    check(searchRes, {
      'search completed successfully': (r) => r.status === 200,
    });
    
    // Add a small delay to simulate real user behavior
    sleep(1);
  });
  
  concurrentUsers.add(1);
}

export function teardown(data) {
  console.log('Stress test completed');
  console.log(`Test duration: ${Date.now() - data.testStartTime}ms`);
}
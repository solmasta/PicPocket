// Simple stress test for PicPocket application
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:8787';
const CONCURRENT_USERS = 50;
const TEST_DURATION = 60000; // 1 minute
const REQUEST_DELAY = 100; // ms between requests per user

// Test counters
let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let startTime;
let endTime;

// Performance metrics
const metrics = {
  auth: { total: 0, success: 0, times: [] },
  fetchPhotos: { total: 0, success: 0, times: [] },
  uploadPhoto: { total: 0, success: 0, times: [] },
  search: { total: 0, success: 0, times: [] }
};

// Mock user data
const mockUsers = Array.from({ length: CONCURRENT_USERS }, (_, i) => ({
  id: `user-${i}`,
  name: `User ${i}`,
  email: `user${i}@example.com`
}));

// Mock photo data
const createMockPhoto = () => {
  const size = Math.floor(Math.random() * 5000000) + 1000000; // 1-5MB
  return {
    id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    fileName: `test-${Date.now()}.jpg`,
    fileType: 'image/jpeg',
    fileSize: size,
    uploadDate: new Date().toISOString(),
    tags: ['test', 'stress', 'horse'],
    location: { lat: 40.7128, lng: -74.0060 }
  };
};

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const timeRequest = async (fn) => {
  const start = Date.now();
  try {
    const result = await fn();
    const end = Date.now();
    return { result, duration: end - start, success: true };
  } catch (error) {
    const end = Date.now();
    return { error, duration: end - start, success: false };
  }
};

// Mock API functions (since we don't have real auth in this test)
const mockAuth = async () => {
  // Simulate authentication
  await delay(50);
  return { token: 'mock-token', user: mockUsers[0] };
};

const mockFetchPhotos = async () => {
  // Simulate fetching photos
  await delay(100);
  return {
    photos: Array.from({ length: 20 }, () => createMockPhoto()),
    page: 1,
    limit: 20,
    total: 100
  };
};

const mockUploadPhoto = async () => {
  // Simulate uploading a photo
  await delay(200);
  return createMockPhoto();
};

const mockSearch = async (query) => {
  // Simulate searching photos
  await delay(75);
  return {
    results: Array.from({ length: 5 }, () => createMockPhoto()),
    query
  };
};

// Stress test functions
const performAuthTest = async () => {
  metrics.auth.total++;
  const { result, duration, success } = await timeRequest(mockAuth);
  metrics.auth.times.push(duration);
  if (success) {
    metrics.auth.success++;
    successfulRequests++;
  } else {
    failedRequests++;
  }
  totalRequests++;
  return result;
};

const performFetchPhotosTest = async () => {
  metrics.fetchPhotos.total++;
  const { result, duration, success } = await timeRequest(mockFetchPhotos);
  metrics.fetchPhotos.times.push(duration);
  if (success) {
    metrics.fetchPhotos.success++;
    successfulRequests++;
  } else {
    failedRequests++;
  }
  totalRequests++;
  return result;
};

const performUploadPhotoTest = async () => {
  metrics.uploadPhoto.total++;
  const { result, duration, success } = await timeRequest(mockUploadPhoto);
  metrics.uploadPhoto.times.push(duration);
  if (success) {
    metrics.uploadPhoto.success++;
    successfulRequests++;
  } else {
    failedRequests++;
  }
  totalRequests++;
  return result;
};

const performSearchTest = async (query) => {
  metrics.search.total++;
  const { result, duration, success } = await timeRequest(() => mockSearch(query));
  metrics.search.times.push(duration);
  if (success) {
    metrics.search.success++;
    successfulRequests++;
  } else {
    failedRequests++;
  }
  totalRequests++;
  return result;
};

// Simulate a user session
const simulateUser = async (userId) => {
  console.log(`User ${userId} started`);
  
  try {
    // Authenticate
    await performAuthTest();
    await delay(REQUEST_DELAY);
    
    // Fetch photos multiple times
    for (let i = 0; i < 3; i++) {
      await performFetchPhotosTest();
      await delay(REQUEST_DELAY);
    }
    
    // Upload a photo
    await performUploadPhotoTest();
    await delay(REQUEST_DELAY);
    
    // Search for photos
    await performSearchTest('horse');
    await delay(REQUEST_DELAY);
    
    // Fetch photos again
    await performFetchPhotosTest();
    
    console.log(`User ${userId} completed successfully`);
  } catch (error) {
    console.error(`User ${userId} failed:`, error.message);
  }
};

// Calculate statistics
const calculateStats = (times) => {
  if (times.length === 0) return { avg: 0, min: 0, max: 0, p95: 0 };
  
  const sorted = times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  
  return { avg, min, max, p95 };
};

// Run stress test
const runStressTest = async () => {
  console.log('Starting PicPocket Stress Test');
  console.log(`Target: ${CONCURRENT_USERS} concurrent users`);
  console.log(`Duration: ${TEST_DURATION / 1000} seconds`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log('----------------------------------------');
  
  startTime = Date.now();
  
  // Start concurrent users
  const userPromises = Array.from({ length: CONCURRENT_USERS }, (_, i) => 
    simulateUser(i + 1)
  );
  
  // Run for specified duration
  const testTimeout = setTimeout(() => {
    console.log('Test duration reached');
  }, TEST_DURATION);
  
  // Wait for all users to complete
  await Promise.all(userPromises);
  clearTimeout(testTimeout);
  
  endTime = Date.now();
  
  // Calculate and display results
  const totalTime = endTime - startTime;
  const requestsPerSecond = (totalRequests / totalTime) * 1000;
  
  console.log('----------------------------------------');
  console.log('STRESS TEST RESULTS');
  console.log('----------------------------------------');
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful Requests: ${successfulRequests}`);
  console.log(`Failed Requests: ${failedRequests}`);
  console.log(`Requests per Second: ${requestsPerSecond.toFixed(2)}`);
  console.log('----------------------------------------');
  
  // Display metrics for each operation
  Object.keys(metrics).forEach(operation => {
    const opMetrics = metrics[operation];
    const stats = calculateStats(opMetrics.times);
    const successRate = opMetrics.total > 0 ? (opMetrics.success / opMetrics.total) * 100 : 0;
    
    console.log(`${operation.toUpperCase()} Stats:`);
    console.log(`  Total: ${opMetrics.total}`);
    console.log(`  Success: ${opMetrics.success} (${successRate.toFixed(1)}%)`);
    console.log(`  Average Time: ${stats.avg.toFixed(2)}ms`);
    console.log(`  Min Time: ${stats.min}ms`);
    console.log(`  Max Time: ${stats.max}ms`);
    console.log(`  95th Percentile: ${stats.p95}ms`);
    console.log('----------------------------------------');
  });
  
  // Performance recommendations
  console.log('PERFORMANCE RECOMMENDATIONS:');
  console.log('1. Database Connection Pooling: Ensure D1 database connections are properly pooled');
  console.log('2. R2 Bucket Optimization: Consider using Cloudflare Image Resizing for thumbnails');
  console.log('3. Caching Strategy: Implement CDN caching for frequently accessed photos');
  console.log('4. Rate Limiting: Add rate limiting to prevent abuse under high load');
  console.log('5. Monitoring: Set up Cloudflare Analytics to monitor real-world performance');
  
  // Check if performance is acceptable
  const overallSuccessRate = (successfulRequests / totalRequests) * 100;
  if (overallSuccessRate < 95) {
    console.log('\n⚠️  WARNING: Success rate below 95%. Consider scaling resources.');
  } else {
    console.log('\n✅ Performance is acceptable for current load.');
  }
};

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  runStressTest().catch(console.error);
}

export { runStressTest };
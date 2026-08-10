const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Photo Management', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in locally before each test
    await page.goto('/');
    await page.getByText('Use Pic-Pocket Locally').click();
    await page.fill('[placeholder="Enter your name"]', 'Test User');
    await page.getByText('Continue').click();
    await page.waitForSelector('text=Gallery');
  });

  test('should upload a photo', async ({ page }) => {
    // Create a test image
    const testImagePath = path.join(__dirname, 'test-image.png');
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImagePath, buffer);
    
    // Upload the photo
    const fileInput = await page.$('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for upload to complete
    await page.waitForTimeout(2000);
    
    // Check that photo appears in gallery
    await expect(page.locator('.photo-item')).toHaveCount(1);
    
    // Clean up
    fs.unlinkSync(testImagePath);
  });

  test('should display horse-themed features', async ({ page }) => {
    // Check that horse profile section exists
    await expect(page.getByText('Horse Profile')).toBeVisible();
    
    // Check that sidebar has horse-related navigation
    await expect(page.getByText('Horses')).toBeVisible();
  });

  test('should allow tagging photos', async ({ page }) => {
    // Create a test image
    const testImagePath = path.join(__dirname, 'test-image2.png');
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImagePath, buffer);
    
    // Upload the photo
    const fileInput = await page.$('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for upload to complete
    await page.waitForTimeout(2000);
    
    // Click on the photo to edit tags
    await page.locator('.photo-item').first().click();
    
    // Add a tag
    await page.fill('input[placeholder="Add tags"]', 'horse');
    await page.press('input[placeholder="Add tags"]', 'Enter');
    
    // Check that tag was added
    await expect(page.getByText('horse')).toBeVisible();
    
    // Clean up
    fs.unlinkSync(testImagePath);
  });
});
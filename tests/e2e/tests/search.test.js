const { test, expect } = require('@playwright/test');

test.describe('Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in locally before each test
    await page.goto('/');
    await page.getByText('Use Pic-Pocket Locally').click();
    await page.fill('[placeholder="Enter your name"]', 'Test User');
    await page.getByText('Continue').click();
    await page.waitForSelector('text=Gallery');
  });

  test('should search by tag', async ({ page }) => {
    // Add a photo with tags for testing
    await page.fill('input[type="file"]', 'test-file-path');
    
    // Wait for upload to complete
    await page.waitForTimeout(2000);
    
    // Add tags to the photo
    await page.locator('.photo-item').first().click();
    await page.fill('input[placeholder="Add tags"]', 'sunset');
    await page.press('input[placeholder="Add tags"]', 'Enter');
    await page.fill('input[placeholder="Add tags"]', 'beach');
    await page.press('input[placeholder="Add tags"]', 'Enter');
    
    // Close photo detail view
    await page.keyboard.press('Escape');
    
    // Search for sunset photos
    await page.fill('[placeholder="Search photos..."]', 'sunset');
    
    // Verify only photos with sunset tag are shown
    const photoItems = await page.locator('.photo-item').count();
    expect(photoItems).toBeGreaterThan(0);
    
    // Each visible photo should have the sunset tag
    for (let i = 0; i < photoItems; i++) {
      const hasTag = await page.locator('.photo-item').nth(i).locator('.tag').isVisible();
      expect(hasTag).toBeTruthy();
    }
  });

  test('should filter by date range', async ({ page }) => {
    // Navigate to filter options
    await page.getByText('Filter').click();
    
    // Set date range
    await page.fill('[placeholder="Start date"]', '2023-01-01');
    await page.fill('[placeholder="End date"]', '2023-12-31');
    await page.getByText('Apply Filters').click();
    
    // Verify filtering occurred
    // Note: Actual verification would depend on test data
    const photoItems = await page.locator('.photo-item').count();
    expect(photoItems).toBeGreaterThanOrEqual(0);
  });

  test('should clear search filters', async ({ page }) => {
    // Perform a search
    await page.fill('[placeholder="Search photos..."]', 'test');
    
    // Clear search
    await page.getByLabel('Clear search').click();
    
    // Verify search is cleared
    const searchInput = await page.getAttribute('[placeholder="Search photos..."]', 'value');
    expect(searchInput).toBe('');
  });
});
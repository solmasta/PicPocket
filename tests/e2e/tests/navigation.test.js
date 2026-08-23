const { test, expect } = require('@playwright/test');

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in locally before each test
    await page.goto('/');
    await page.getByText('Use Pic-Pocket Locally').click();
    await page.fill('[placeholder="Enter your name"]', 'Test User');
    await page.getByText('Continue').click();
    await page.waitForSelector('text=Gallery');
  });

  test('should navigate between main sections', async ({ page }) => {
    // Check initial state - Gallery should be active
    await expect(page.getByText('Gallery')).toBeVisible();
    
    // Navigate to Horses section
    await page.getByText('Horses').click();
    await expect(page.getByText('Horses')).toBeVisible();
    
    // Navigate to Tags section
    await page.getByText('Tags').click();
    await expect(page.getByText('Tags')).toBeVisible();
    
    // Navigate to Settings section
    await page.getByText('Settings').click();
    await expect(page.getByText('Settings')).toBeVisible();
    
    // Back to Gallery
    await page.getByText('Gallery').click();
    await expect(page.getByText('Gallery')).toBeVisible();
  });

  test('should maintain state when navigating', async ({ page }) => {
    // Switch to list view
    await page.getByLabel('Switch to list view').click();
    
    // Navigate away and back
    await page.getByText('Horses').click();
    await page.getByText('Gallery').click();
    
    // Check that list view is still active
    const listViewButton = await page.getByLabel('Switch to grid view');
    await expect(listViewButton).toBeVisible();
  });
});
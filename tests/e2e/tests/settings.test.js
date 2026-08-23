const { test, expect } = require('@playwright/test');

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in locally before each test
    await page.goto('/');
    await page.getByText('Use Pic-Pocket Locally').click();
    await page.fill('[placeholder="Enter your name"]', 'Test User');
    await page.getByText('Continue').click();
    await page.waitForSelector('text=Gallery');
  });

  test('should toggle dark mode', async ({ page }) => {
    // Navigate to settings
    await page.getByText('Settings').click();
    
    // Check initial state - should be light mode
    const darkModeToggle = page.getByLabel('Dark mode');
    await expect(darkModeToggle).toBeVisible();
    
    // Toggle to dark mode
    await darkModeToggle.click();
    
    // Verify dark mode is enabled
    const body = page.locator('body');
    await expect(body).toHaveClass(/dark-mode/);
    
    // Toggle back to light mode
    await darkModeToggle.click();
    
    // Verify light mode is enabled
    await expect(body).not.toHaveClass(/dark-mode/);
  });

  test('should change username', async ({ page }) => {
    // Navigate to settings
    await page.getByText('Settings').click();
    
    // Change username
    const newName = 'Updated Test User';
    await page.fill('[placeholder="Enter your name"]', newName);
    await page.getByText('Update Name').click();
    
    // Verify name updated in header
    await expect(page.getByText(newName)).toBeVisible();
    
    // Navigate to home and verify persistence
    await page.getByText('Gallery').click();
    await expect(page.getByText(newName)).toBeVisible();
  });

  test('should export data', async ({ page }) => {
    // Navigate to settings
    await page.getByText('Settings').click();
    
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.getByText('Export Data').click();
    const download = await downloadPromise;
    
    // Verify download occurred
    expect(download.suggestedFilename()).toContain('.json');
  });
});
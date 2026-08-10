const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test('should allow local user sign-in', async ({ page }) => {
    await page.goto('/');
    
    // Check that we're on the splash screen
    await expect(page.getByText('Pic-Pocket')).toBeVisible();
    
    // Click "Use Pic-Pocket Locally" button
    await page.getByText('Use Pic-Pocket Locally').click();
    
    // Wait for and fill in the username
    await page.waitForSelector('[placeholder="Enter your name"]');
    await page.fill('[placeholder="Enter your name"]', 'Test User');
    
    // Click continue
    await page.getByText('Continue').click();
    
    // Should be redirected to the main app
    await expect(page.getByText('Test User')).toBeVisible();
    await expect(page.getByText('Gallery')).toBeVisible();
  });

  test('should allow logout', async ({ page }) => {
    await page.goto('/');
    
    // Sign in locally
    await page.getByText('Use Pic-Pocket Locally').click();
    await page.fill('[placeholder="Enter your name"]', 'Test User');
    await page.getByText('Continue').click();
    
    // Wait for app to load
    await page.waitForSelector('text=Gallery');
    
    // Click logout button
    await page.getByLabel('Sign out').click();
    
    // Should be back on splash screen
    await expect(page.getByText('Pic-Pocket')).toBeVisible();
  });
});
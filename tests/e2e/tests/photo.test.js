const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// A minimal valid 1x1 PNG, reused from the previous version of this file.
const TEST_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

test.describe('Photo Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const localButton = page.getByRole('button', { name: /use pic-pocket locally/i });
    const uploadNav = page.getByRole('button', { name: 'Upload', exact: true });
    await expect(localButton.or(uploadNav)).toBeVisible({ timeout: 15_000 });
    if (await localButton.isVisible()) {
      await localButton.click();
    }
    await expect(uploadNav).toBeVisible({ timeout: 15_000 });
  });

  test('should upload a photo', async ({ page }) => {
    const testImagePath = path.join(__dirname, 'test-image.png');
    fs.writeFileSync(testImagePath, Buffer.from(TEST_PNG_BASE64, 'base64'));

    try {
      await page.getByRole('button', { name: 'Upload', exact: true }).click();
      await page.setInputFiles('input[type="file"]', testImagePath);
      await expect(page.getByText('Selected Photos (1)')).toBeVisible();

      await page.locator('.submit-button').click();
      // The upload form clears (and the preview grid disappears) once the
      // sequential upload loop finishes.
      await expect(page.getByText('Selected Photos (1)')).toBeHidden({ timeout: 20_000 });

      await page.getByRole('button', { name: 'Gallery', exact: true }).click();
      await expect(page.locator('.photo-grid .photo-card')).toHaveCount(1);
    } finally {
      fs.unlinkSync(testImagePath);
    }
  });

  test('should display the Horse Profile feature', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Horse Profile' })).toBeVisible();
  });

  test('should allow tagging a photo before upload, and the tag persists to the Gallery', async ({ page }) => {
    const testImagePath = path.join(__dirname, 'test-image2.png');
    fs.writeFileSync(testImagePath, Buffer.from(TEST_PNG_BASE64, 'base64'));

    try {
      await page.getByRole('button', { name: 'Upload', exact: true }).click();
      await page.setInputFiles('input[type="file"]', testImagePath);

      await page.getByLabel('Add tag').fill('horse');
      await page.getByLabel('Add tag').press('Enter');
      await expect(page.getByText('#horse')).toBeVisible();

      await page.locator('.submit-button').click();
      await expect(page.getByText('Selected Photos (1)')).toBeHidden({ timeout: 20_000 });

      await page.getByRole('button', { name: 'Gallery', exact: true }).click();
      await expect(page.getByText('#horse')).toBeVisible();
    } finally {
      fs.unlinkSync(testImagePath);
    }
  });
});

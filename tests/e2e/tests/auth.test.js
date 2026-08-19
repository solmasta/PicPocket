const { test, expect } = require('@playwright/test');

// Signs in through whichever path is actually offered: if Google auth is
// configured, "Use Pic-Pocket Locally" is one option among others; if it
// isn't, useAuth skips the gate and lands straight in local mode with no
// button to click at all. Either way there's no "enter your name, click
// Continue" step in the current app — that flow doesn't exist.
async function enterApp(page) {
  await page.goto('/');
  const localButton = page.getByRole('button', { name: /use pic-pocket locally/i });
  const uploadNav = page.getByRole('button', { name: 'Upload', exact: true });
  await expect(localButton.or(uploadNav)).toBeVisible({ timeout: 15_000 });
  if (await localButton.isVisible()) {
    await localButton.click();
  }
  await expect(uploadNav).toBeVisible({ timeout: 15_000 });
}

test.describe('Authentication Flow', () => {
  test('should allow local user sign-in', async ({ page }) => {
    await enterApp(page);

    await expect(page.getByRole('button', { name: 'Gallery', exact: true })).toBeVisible();
    await expect(page.getByText('Local User')).toBeVisible();
  });

  test('should allow signing out back to the sign-in screen', async ({ page }) => {
    await enterApp(page);

    await page.getByRole('button', { name: /^sign out/i }).click();

    // Signing out always returns to the chooser screen, regardless of
    // whether Google auth is configured for this build.
    await expect(page.getByRole('button', { name: /use pic-pocket locally/i })).toBeVisible();
  });
});

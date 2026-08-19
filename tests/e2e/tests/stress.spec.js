// Real browser stress test of the actual, current PicPocket UI: bulk photo
// upload through the real upload pipeline (resize -> thumbnail -> SHA-256
// hash -> IndexedDB -> best-effort AI analyze call), then the Gallery and
// the AI Storage Insights duplicate-detection panel at that volume.
//
// This intentionally does NOT reuse tests/photo.test.js or auth.test.js —
// both click through UI (a name-entry "Continue" step, a `.photo-item`
// class, a `input[placeholder="Add tags"]`) that doesn't exist in the
// current app anymore, so they've been failing silently as dead weight.
// This file is scoped to stress/volume behavior only.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const IMAGE_DIR = process.env.STRESS_IMAGE_DIR;
test.skip(!IMAGE_DIR, 'Set STRESS_IMAGE_DIR to a folder of test images to run the stress test');

test.describe('Bulk upload stress test', () => {
  test('uploads a batch of photos (including exact duplicates) and the Gallery/Storage tabs stay correct and responsive', async ({ page }) => {
    test.setTimeout(180_000);

    const files = fs
      .readdirSync(IMAGE_DIR)
      .filter((f) => f.endsWith('.png'))
      .map((f) => path.join(IMAGE_DIR, f));
    expect(files.length).toBeGreaterThan(0);

    const consoleErrors = [];
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`console.error: ${msg.text()}`);
    });

    // No backend is running in this test, so every per-photo AI analyze
    // call would otherwise be a real failed TCP connect to localhost:8787.
    // Short-circuit it to an instant response so the upload-pipeline
    // timing below isolates the app's own work from that network path.
    await page.route('**/api/ai/**', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));

    const nav0 = Date.now();
    await page.goto('/');
    // With no Google Client ID baked into this build, useAuth skips the
    // sign-in gate entirely and lands straight in local mode — only click
    // through it if it's actually shown (i.e. Google auth is configured).
    const localButton = page.getByRole('button', { name: /use pic-pocket locally/i });
    const uploadNav = page.getByRole('button', { name: 'Upload', exact: true });
    await expect(localButton.or(uploadNav)).toBeVisible({ timeout: 15_000 });
    if (await localButton.isVisible()) {
      await localButton.click();
    }
    await expect(uploadNav).toBeVisible({ timeout: 15_000 });
    console.log(`[stress] sign-in -> app shell: ${Date.now() - nav0}ms`);

    await uploadNav.click();
    await expect(page.getByLabel(/select photos to upload/i)).toBeAttached();

    const selectStart = Date.now();
    await page.setInputFiles('input[type="file"]', files);
    await expect(page.getByText(`Selected Photos (${files.length})`)).toBeVisible();
    console.log(`[stress] staged ${files.length} files: ${Date.now() - selectStart}ms`);

    const uploadStart = Date.now();
    await page.getByRole('button', { name: new RegExp(`Upload ${files.length} Photo`, 'i') }).click();
    // Sequential per-file pipeline (resize, thumbnail, hash, best-effort AI
    // call against a backend that isn't running here) — give it real room.
    await expect(page.getByRole('button', { name: /^upload \d+ photo/i })).toBeVisible({ timeout: 150_000 });
    const uploadDuration = Date.now() - uploadStart;
    console.log(`[stress] full upload batch of ${files.length}: ${uploadDuration}ms (${(uploadDuration / files.length).toFixed(0)}ms/photo)`);

    // Gallery: every photo should have landed, and the drive filter bar
    // should reflect "not backed up anywhere" for all of them (no cloud
    // accounts connected in this run).
    const galleryStart = Date.now();
    await page.getByRole('button', { name: 'Gallery' }).click();
    await expect(page.locator('.photo-grid .photo-card').first()).toBeVisible({ timeout: 15_000 });
    const cardCount = await page.locator('.photo-grid .photo-card').count();
    console.log(`[stress] gallery render of ${cardCount} cards: ${Date.now() - galleryStart}ms`);
    expect(cardCount).toBe(files.length);
    await expect(page.getByRole('tab', { name: /not backed up/i })).toContainText(String(files.length));

    // Storage tab: AI Storage Insights has to group the 3x5 exact-duplicate
    // sets client-side (buildStorageStats) and StorageLedger has to render
    // a full-size table — both over the whole library at once.
    const storageStart = Date.now();
    await page.getByRole('button', { name: 'Storage Ledger' }).click();
    await expect(page.getByText(/duplicate photos/i)).toBeVisible({ timeout: 20_000 });
    console.log(`[stress] storage tab (insights + ledger) render: ${Date.now() - storageStart}ms`);

    const dupGroups = files.length === 55 ? 3 : null; // only asserted for the default fixture set
    if (dupGroups !== null) {
      await expect(page.getByText(new RegExp(`${dupGroups} groups?`, 'i'))).toBeVisible();
    }

    // No uncaught JS errors anywhere in the run. AI calls are *expected* to
    // fail here (no backend running in this test) — the app's own handling
    // surfaces as console.warn ("AI photo analysis unavailable..."), but
    // Chrome also independently logs the underlying network failure as a
    // console.error ("Failed to load resource: net::ERR_CONNECTION_REFUSED").
    // Both are filtered as expected noise; anything else still fails the test.
    const realErrors = consoleErrors.filter(
      (e) =>
        !/AI (photo analysis|storage insights)/i.test(e) &&
        !/ERR_CONNECTION_(REFUSED|RESET)/.test(e) &&
        !/status of 503/.test(e)
    );
    expect(realErrors, `Unexpected console/page errors during stress run:\n${realErrors.join('\n')}`).toEqual([]);
  });
});

/**
 * Demo Video Recording Script
 *
 * Records a SINGLE continuous demo video showcasing Data Hub's key features.
 * Uses one browser context throughout for natural flow.
 * Post-processing (compile-demo.js) will trim unnecessary parts.
 *
 * TODO: Refine demo video further - adjust timing, improve transitions,
 *       add more detailed feature showcases, review final cut quality.
 *
 * Usage: npm run video:record
 *
 * Prerequisites:
 *   1. Local Supabase running: `supabase start`
 *   2. Demo data created: `npm run video:setup`
 *   3. Dev servers running: `npm run dev`
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  // Recording settings
  viewport: { width: 1280, height: 720 },
  outputDir: path.resolve(__dirname, '../client/public/assets/demo'),
  outputFile: 'raw-demo.webm',

  // App URLs
  baseUrl: 'http://localhost:5173',

  // Login credentials - MUST match setup-demo-data.js
  credentials: {
    email: 'demo@datahub.local',
    password: 'demodemo123',
  },

  // Timing (milliseconds) - adjust for demo pacing
  delays: {
    instant: 100,
    short: 500,
    medium: 1500,
    long: 2500,
    veryLong: 4000,
    dramatic: 6000,
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

function ensureDirectories() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
}

/**
 * Wait for page content to be fully ready (loading animations gone)
 */
async function waitForContentReady(page) {
  await page.waitForLoadState('networkidle');

  // Wait for loading animations to disappear
  const loadingSelectors = [
    '[class*="loadingAnimation"]',
    '[class*="LoadingAnimation"]',
    'img[alt="Loading"]',
  ];

  for (const selector of loadingSelectors) {
    try {
      const loading = page.locator(selector);
      if (await loading.isVisible({ timeout: 500 })) {
        await loading.waitFor({ state: 'hidden', timeout: 8000 });
      }
    } catch {
      // Selector not present or already hidden
    }
  }

  await page.waitForTimeout(CONFIG.delays.short);
}

/**
 * Highlight element with gold glow before clicking (visual cue for viewers)
 */
async function highlightAndClick(page, selector, options = {}) {
  const locator = page.locator(selector).first();

  try {
    await locator.waitFor({ state: 'visible', timeout: 5000 });
    await locator.scrollIntoViewIfNeeded();

    // Add visual highlight effect
    await locator.evaluate((el) => {
      el.style.transition = 'box-shadow 0.3s ease';
      el.style.boxShadow = '0 0 0 3px #FFD700, 0 0 20px rgba(255, 215, 0, 0.6)';
      setTimeout(() => {
        el.style.boxShadow = '';
      }, 800);
    });

    await page.waitForTimeout(400);
    await locator.click();
    await page.waitForTimeout(options.delay || CONFIG.delays.short);
  } catch (error) {
    console.warn(`  Could not click ${selector}: ${error.message}`);
  }
}

/**
 * Type text with realistic typing speed
 */
async function typeText(page, selector, text, options = {}) {
  const locator = page.locator(selector).first();
  try {
    await locator.waitFor({ state: 'visible', timeout: 5000 });
    await locator.clear();
    await locator.type(text, { delay: options.typeDelay || 60 });
    await page.waitForTimeout(options.delay || CONFIG.delays.short);
  } catch (error) {
    console.warn(`  Could not type in ${selector}: ${error.message}`);
  }
}

/**
 * Smooth scroll within an element or the page
 */
async function smoothScroll(page, selector = null, distance = 300) {
  if (selector) {
    const locator = page.locator(selector).first();
    await locator.evaluate((el, d) => {
      el.scrollBy({ top: d, behavior: 'smooth' });
    }, distance);
  } else {
    await page.evaluate((d) => {
      window.scrollBy({ top: d, behavior: 'smooth' });
    }, distance);
  }
  await page.waitForTimeout(CONFIG.delays.medium);
}

// =============================================================================
// Main Recording Flow
// =============================================================================

async function recordDemo() {
  console.log('='.repeat(60));
  console.log('Data Hub Demo Recording - Continuous Take');
  console.log('='.repeat(60));
  console.log(`Output: ${path.join(CONFIG.outputDir, CONFIG.outputFile)}`);
  console.log(`Resolution: ${CONFIG.viewport.width}x${CONFIG.viewport.height}`);

  ensureDirectories();

  // Clear previous raw recording
  const outputPath = path.join(CONFIG.outputDir, CONFIG.outputFile);
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  // Launch browser with video recording
  const browser = await chromium.launch({
    headless: false,
    slowMo: 30,
  });

  const context = await browser.newContext({
    viewport: CONFIG.viewport,
    recordVideo: {
      dir: CONFIG.outputDir,
      size: CONFIG.viewport,
    },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });

  const page = await context.newPage();

  try {
    // =========================================================================
    // SCENE 1: Landing Page (Hero)
    // =========================================================================
    console.log('\n[SCENE 1] Landing Page...');
    await page.goto(CONFIG.baseUrl);
    await waitForContentReady(page);
    await page.waitForTimeout(CONFIG.delays.dramatic);

    // Scroll to show features
    await smoothScroll(page, null, 400);
    await page.waitForTimeout(CONFIG.delays.long);

    // Scroll back up
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await page.waitForTimeout(CONFIG.delays.medium);

    // =========================================================================
    // SCENE 2: Login
    // =========================================================================
    console.log('\n[SCENE 2] Login...');
    await page.goto(`${CONFIG.baseUrl}/login`);
    await waitForContentReady(page);
    await page.waitForTimeout(CONFIG.delays.long);

    // Enter credentials
    await typeText(page, '#email, input[type="email"], input[name="email"]', CONFIG.credentials.email, { typeDelay: 80 });
    await page.waitForTimeout(CONFIG.delays.short);

    await typeText(page, '#password, input[type="password"], input[name="password"]', CONFIG.credentials.password, { typeDelay: 60 });
    await page.waitForTimeout(CONFIG.delays.medium);

    // Click sign in
    await highlightAndClick(page, 'button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await waitForContentReady(page);
    console.log('  Logged in successfully');

    // =========================================================================
    // SCENE 3: Onboarding Wizard (Full Walkthrough)
    // =========================================================================
    console.log('\n[SCENE 3] Onboarding Wizard...');

    // Clear any existing onboarding flag to ensure wizard appears
    await page.evaluate(() => {
      localStorage.removeItem('datahub_onboarding_complete');
    });
    await page.reload();
    await waitForContentReady(page);

    // Wait for onboarding wizard overlay to appear
    const wizardOverlay = page.locator('[class*="overlay_"]').first();
    try {
      await wizardOverlay.waitFor({ state: 'visible', timeout: 8000 });
      console.log('  Onboarding wizard detected');

      // STEP 1: Welcome - appreciate the content
      console.log('  Step 1: Welcome');
      await page.waitForTimeout(CONFIG.delays.dramatic);

      // Scroll within the wizard content if needed
      const wizardContent = page.locator('[class*="container_"]').first();
      if (await wizardContent.isVisible()) {
        await wizardContent.evaluate((el) => {
          el.scrollBy({ top: 200, behavior: 'smooth' });
        });
        await page.waitForTimeout(CONFIG.delays.medium);
      }

      // Click Next → Step 2
      await highlightAndClick(page, 'button:has-text("Next")');
      await page.waitForTimeout(CONFIG.delays.long);

      // STEP 2: How It Works
      console.log('  Step 2: How It Works');
      await page.waitForTimeout(CONFIG.delays.dramatic);

      // Scroll to show more content
      if (await wizardContent.isVisible()) {
        await wizardContent.evaluate((el) => {
          el.scrollBy({ top: 200, behavior: 'smooth' });
        });
        await page.waitForTimeout(CONFIG.delays.medium);
      }

      // Click Next → Step 3
      await highlightAndClick(page, 'button:has-text("Next")');
      await page.waitForTimeout(CONFIG.delays.long);

      // STEP 3: Get Started (Complete)
      console.log('  Step 3: Get Started');
      await page.waitForTimeout(CONFIG.delays.dramatic);

      // Click the final button to complete
      await highlightAndClick(page, 'button:has-text("Next"), button:has-text("Complete"), button:has-text("Get Started")');
      await page.waitForTimeout(CONFIG.delays.long);

      // Wait for wizard to close
      await wizardOverlay.waitFor({ state: 'hidden', timeout: 5000 });
      console.log('  Onboarding completed');
    } catch (error) {
      console.warn(`  Onboarding issue: ${error.message}`);
      // Try to dismiss if stuck
      const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Skip")');
      if (await cancelBtn.isVisible({ timeout: 1000 })) {
        await cancelBtn.click();
        await page.waitForTimeout(CONFIG.delays.medium);
      }
    }

    // Mark onboarding complete (version '1' to match useOnboarding.js)
    await page.evaluate(() => {
      localStorage.setItem('datahub_onboarding_complete', '1');
    });

    // =========================================================================
    // SCENE 4: Dashboard Overview
    // =========================================================================
    console.log('\n[SCENE 4] Dashboard...');
    await waitForContentReady(page);
    await page.waitForTimeout(CONFIG.delays.dramatic);

    // Hover over client card to show interactivity
    const clientCard = page.locator('a[href*="/dashboard/clients/"]').first();
    if (await clientCard.isVisible({ timeout: 3000 })) {
      await clientCard.hover();
      await page.waitForTimeout(CONFIG.delays.medium);

      // Click to enter client detail
      await highlightAndClick(page, 'a[href*="/dashboard/clients/"]');
      await waitForContentReady(page);
      await page.waitForTimeout(CONFIG.delays.long);
    }

    // =========================================================================
    // SCENE 5: Client Detail - Data Sources Tab
    // =========================================================================
    console.log('\n[SCENE 5] Data Sources...');
    await highlightAndClick(page, '[role="tab"]:has-text("Data Sources")');
    await waitForContentReady(page);
    await page.waitForTimeout(CONFIG.delays.long);

    // Show existing sources
    await page.waitForTimeout(CONFIG.delays.medium);

    // Open Add Source wizard briefly
    const addSourceBtn = page.locator('button:has-text("Add Source")');
    if (await addSourceBtn.isVisible({ timeout: 3000 })) {
      await highlightAndClick(page, 'button:has-text("Add Source")');
      await page.waitForTimeout(CONFIG.delays.long);

      // Show platform selection
      await page.waitForTimeout(CONFIG.delays.dramatic);

      // Cancel wizard
      const cancelBtn = page.locator('button:has-text("Cancel")');
      if (await cancelBtn.isVisible({ timeout: 2000 })) {
        await cancelBtn.click();
        await page.waitForTimeout(CONFIG.delays.medium);
      }
    }

    // =========================================================================
    // SCENE 6: Data Warehouse Tab
    // =========================================================================
    console.log('\n[SCENE 6] Data Warehouse...');
    await highlightAndClick(page, '[role="tab"]:has-text("Data Warehouse")');
    await waitForContentReady(page);
    await page.waitForTimeout(CONFIG.delays.dramatic);

    // Click on warehouse card if available
    const warehouseCard = page.locator('[class*="warehouse"], [class*="card"]').first();
    if (await warehouseCard.isVisible({ timeout: 3000 })) {
      await warehouseCard.click();
      await page.waitForTimeout(CONFIG.delays.long);

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(CONFIG.delays.medium);
    }

    // =========================================================================
    // SCENE 7: Reports Tab
    // =========================================================================
    console.log('\n[SCENE 7] Reports...');
    await highlightAndClick(page, '[role="tab"]:has-text("Reports")');
    await waitForContentReady(page);
    await page.waitForTimeout(CONFIG.delays.long);

    // Click on report card if available
    const reportCard = page.locator('[class*="report"], [class*="card"]').first();
    if (await reportCard.isVisible({ timeout: 3000 })) {
      await reportCard.click();
      await page.waitForTimeout(CONFIG.delays.long);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(CONFIG.delays.short);
    }

    // Open Add Report wizard briefly
    const addReportBtn = page.locator('button:has-text("Add Report")');
    if (await addReportBtn.isVisible({ timeout: 3000 })) {
      await highlightAndClick(page, 'button:has-text("Add Report")');
      await page.waitForTimeout(CONFIG.delays.long);

      // Show visualization options
      await page.waitForTimeout(CONFIG.delays.dramatic);

      // Cancel wizard
      const cancelBtn2 = page.locator('button:has-text("Cancel")');
      if (await cancelBtn2.isVisible({ timeout: 2000 })) {
        await cancelBtn2.click();
        await page.waitForTimeout(CONFIG.delays.medium);
      }
    }

    // =========================================================================
    // SCENE 8: Data Lineage Tab
    // =========================================================================
    console.log('\n[SCENE 8] Data Lineage...');
    await highlightAndClick(page, '[role="tab"]:has-text("Data Lineage")');
    await waitForContentReady(page);
    await page.waitForTimeout(CONFIG.delays.dramatic);

    // =========================================================================
    // SCENE 9: Outro - Return to Dashboard
    // =========================================================================
    console.log('\n[SCENE 9] Outro...');
    await page.goto(`${CONFIG.baseUrl}/dashboard`);
    await waitForContentReady(page);
    await page.waitForTimeout(CONFIG.delays.dramatic);

    // Final pause
    await page.waitForTimeout(CONFIG.delays.long);

    console.log('\n' + '='.repeat(60));
    console.log('Recording Complete!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\nRecording failed:', error);
    throw error;
  } finally {
    // Get the video path before closing
    const videoPath = await page.video().path();
    await page.close();
    await context.close();
    await browser.close();

    // Rename the video to our expected filename
    if (fs.existsSync(videoPath)) {
      const finalPath = path.join(CONFIG.outputDir, CONFIG.outputFile);
      fs.renameSync(videoPath, finalPath);

      const stats = fs.statSync(finalPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      console.log(`\nOutput: ${finalPath}`);
      console.log(`Size: ${sizeMB} MB`);
      console.log('\nNext step: npm run video:compile');
    }
  }
}

// Run
recordDemo().catch((error) => {
  console.error('Failed to record demo:', error);
  process.exit(1);
});

/**
 * CSV Upload E2E Tests
 *
 * Tests CSV file upload functionality for all supported platforms.
 * Validates successful uploads, progress indicators, and data preview.
 */

import { test, expect } from '@playwright/test'
import {
  login,
  getTestId,
  cleanupByTestId,
  createClientViaAPI,
  TEST_EMAIL,
  TEST_PASSWORD,
  ONBOARDING_KEY,
  getFixturePath,
  clientDetailRoute,
} from '../fixtures/e2e-helpers'
import { ClientDetailPage, SourceWizardPage } from '../pages'

test.describe('CSV Upload', () => {
  let testId: string
  let clientId: string
  let clientDetailPage: ClientDetailPage
  let sourceWizard: SourceWizardPage

  test.beforeEach(async ({ page }) => {
    testId = getTestId()

    // Authenticate
    await login(page, TEST_EMAIL, TEST_PASSWORD)

    // Skip onboarding
    await page.evaluate((key) => localStorage.setItem(key, '1'), ONBOARDING_KEY)

    // Create a test client via API
    const client = await createClientViaAPI(testId)
    clientId = client.id

    // Navigate to client detail page
    await page.goto(clientDetailRoute(clientId))
    await page.waitForLoadState('networkidle')

    // Initialize page objects
    clientDetailPage = new ClientDetailPage(page)
    sourceWizard = new SourceWizardPage(page)
  })

  test.afterEach(async () => {
    await cleanupByTestId(testId)
  })

  /**
   * Helper to navigate to upload step for a given platform
   */
  async function navigateToUploadStep(platform: string) {
    await clientDetailPage.openAddSourceWizard()
    await sourceWizard.waitForWizard()
    await sourceWizard.selectPlatform(platform)
    await sourceWizard.clickNext()
    await sourceWizard.approveConfiguration()
    await sourceWizard.clickNext()
    await sourceWizard.selectWarehouseOption('skip')
    await sourceWizard.clickNext()
    await sourceWizard.expectUploadStep()
  }

  test.describe('Platform CSV Uploads', () => {
    test('uploads Meta Ads CSV successfully', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      const csvPath = getFixturePath('platforms/meta-ads/meta_ads_basic.csv')
      await sourceWizard.uploadFile(csvPath)

      // Should show success indicator
      await expect(page.getByText(/rows uploaded|upload complete/i)).toBeVisible({ timeout: 15000 })
    })

    test('uploads Google Ads CSV successfully', async ({ page }) => {
      await navigateToUploadStep('Google Ads')

      const csvPath = getFixturePath('platforms/google-ads/google_ads_basic.csv')
      await sourceWizard.uploadFile(csvPath)

      await expect(page.getByText(/rows uploaded|upload complete/i)).toBeVisible({ timeout: 15000 })
    })

    test('uploads GA4 CSV successfully', async ({ page }) => {
      await navigateToUploadStep('GA4')

      const csvPath = getFixturePath('platforms/ga4/ga4_basic.csv')
      await sourceWizard.uploadFile(csvPath)

      await expect(page.getByText(/rows uploaded|upload complete/i)).toBeVisible({ timeout: 15000 })
    })

    test('uploads TikTok Ads CSV successfully', async ({ page }) => {
      await navigateToUploadStep('TikTok')

      const csvPath = getFixturePath('platforms/tiktok-ads/tiktok_ads_basic.csv')
      await sourceWizard.uploadFile(csvPath)

      await expect(page.getByText(/rows uploaded|upload complete/i)).toBeVisible({ timeout: 15000 })
    })

    test('uploads Shopify CSV successfully', async ({ page }) => {
      await navigateToUploadStep('Shopify')

      const csvPath = getFixturePath('platforms/shopify/shopify_basic.csv')
      await sourceWizard.uploadFile(csvPath)

      await expect(page.getByText(/rows uploaded|upload complete/i)).toBeVisible({ timeout: 15000 })
    })

    test('uploads Custom platform CSV successfully', async ({ page }) => {
      await navigateToUploadStep('Custom')

      const csvPath = getFixturePath('platforms/custom/custom_platform.csv')
      await sourceWizard.uploadFile(csvPath)

      await expect(page.getByText(/rows uploaded|upload complete/i)).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('Upload UI Behavior', () => {
    test('shows file uploader component', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      // Should see drop zone with upload instructions
      await expect(page.getByText(/drag.*drop|click to browse/i)).toBeVisible()
      await expect(page.getByText(/csv files up to 10mb/i)).toBeVisible()
    })

    test('shows progress during upload', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      const csvPath = getFixturePath('platforms/meta-ads/meta_ads_full.csv')

      // Start upload and check for progress indicator
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(csvPath)

      // Should show uploading state with spinner
      await expect(page.locator('[class*="hourglass"], [class*="uploading"]')).toBeVisible({ timeout: 5000 })
    })

    test('shows row count after successful upload', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      const csvPath = getFixturePath('platforms/meta-ads/meta_ads_basic.csv')
      await sourceWizard.uploadFile(csvPath)

      // Should show row count (meta_ads_basic.csv has 55 rows)
      await expect(page.getByText(/\d+ rows/i)).toBeVisible({ timeout: 15000 })
    })

    test('can skip upload and complete wizard', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      // Skip upload
      await sourceWizard.skipUpload()

      // Complete the wizard
      await sourceWizard.complete()
      await sourceWizard.waitForWizardToClose()
    })

    test('upload another file button appears after success', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      const csvPath = getFixturePath('platforms/meta-ads/meta_ads_basic.csv')
      await sourceWizard.uploadFile(csvPath)

      // Should see option to upload another file
      await expect(page.getByRole('button', { name: /upload another|try again/i })).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('Data Preview', () => {
    test('shows data preview after upload', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      const csvPath = getFixturePath('platforms/meta-ads/meta_ads_basic.csv')
      await sourceWizard.uploadFile(csvPath)

      // Wait for upload to complete
      await expect(page.getByText(/rows uploaded/i)).toBeVisible({ timeout: 15000 })

      // Should show data preview section
      await expect(page.getByText(/data preview/i)).toBeVisible()

      // Should show column headers from the CSV
      await expect(page.getByText(/campaign_name|date_start/i)).toBeVisible()
    })

    test('preview shows first few rows', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      const csvPath = getFixturePath('platforms/meta-ads/meta_ads_basic.csv')
      await sourceWizard.uploadFile(csvPath)

      await expect(page.getByText(/rows uploaded/i)).toBeVisible({ timeout: 15000 })

      // Should show a table with data rows
      const previewTable = page.locator('[class*="preview"] table, [class*="DataPreview"]')
      await expect(previewTable).toBeVisible()
    })
  })

  test.describe('Validation', () => {
    test('shows validate button after upload', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      const csvPath = getFixturePath('platforms/meta-ads/meta_ads_basic.csv')
      await sourceWizard.uploadFile(csvPath)

      await expect(page.getByText(/rows uploaded/i)).toBeVisible({ timeout: 15000 })

      // Should show validate button
      await expect(page.getByRole('button', { name: /validate/i })).toBeVisible()
    })

    test('validation success shows row count', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      const csvPath = getFixturePath('platforms/meta-ads/meta_ads_basic.csv')
      await sourceWizard.uploadFile(csvPath)

      await expect(page.getByText(/rows uploaded/i)).toBeVisible({ timeout: 15000 })

      // Click validate
      await page.getByRole('button', { name: /validate/i }).click()

      // Should show validation success with row count
      await expect(page.getByText(/data validated|rows ready/i)).toBeVisible({ timeout: 10000 })
    })
  })
})

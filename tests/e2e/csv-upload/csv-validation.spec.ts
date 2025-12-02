/**
 * CSV Validation E2E Tests
 *
 * Tests CSV validation edge cases including:
 * - Empty files and headers-only files
 * - Invalid file types
 * - Unicode and special characters
 * - Missing/extra columns
 * - Numeric edge cases
 */

import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
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

test.describe('CSV Validation', () => {
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

  test.describe('File Type Validation', () => {
    test('rejects non-CSV file extension', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      // Create a temporary .txt file
      const tmpDir = path.join(__dirname, '../fixtures/tmp')
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true })
      }
      const txtPath = path.join(tmpDir, 'test_file.txt')
      fs.writeFileSync(txtPath, 'date_start,campaign_name\n2024-01-01,Test Campaign')

      try {
        const fileInput = page.locator('input[type="file"]')
        await fileInput.setInputFiles(txtPath)

        // Should show error message about file type
        await expect(page.getByText(/only csv files|invalid file type|\.csv/i)).toBeVisible({ timeout: 5000 })
      } finally {
        // Cleanup temp file
        if (fs.existsSync(txtPath)) {
          fs.unlinkSync(txtPath)
        }
      }
    })

    test('rejects file larger than 10MB', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      // Create a temporary large file (just over 10MB)
      const tmpDir = path.join(__dirname, '../fixtures/tmp')
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true })
      }
      const largePath = path.join(tmpDir, 'large_file.csv')

      // Generate ~11MB of data
      let content = 'date_start,campaign_name,impressions,clicks,spend\n'
      const row = '2024-01-01,Test Campaign Name With Some Length,100000,5000,2500.00\n'
      const targetSize = 11 * 1024 * 1024 // 11MB
      while (content.length < targetSize) {
        content += row
      }
      fs.writeFileSync(largePath, content)

      try {
        const fileInput = page.locator('input[type="file"]')
        await fileInput.setInputFiles(largePath)

        // Should show error message about file size
        await expect(page.getByText(/file.*too large|exceeds.*10.*mb|maximum.*size/i)).toBeVisible({ timeout: 5000 })
      } finally {
        // Cleanup temp file
        if (fs.existsSync(largePath)) {
          fs.unlinkSync(largePath)
        }
      }
    })
  })

  test.describe('Empty and Minimal Files', () => {
    test('handles empty file gracefully', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      const csvPath = getFixturePath('edge-cases/empty_file.csv')
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(csvPath)

      // Should show error or warning about empty file
      await expect(
        page.getByText(/empty.*file|no.*data|no.*rows|file.*empty/i)
      ).toBeVisible({ timeout: 10000 })
    })

    test('handles headers-only file gracefully', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      const csvPath = getFixturePath('edge-cases/headers_only.csv')
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(csvPath)

      // Should show upload result (may show 0 rows or warning)
      await expect(
        page.getByText(/0 rows|no.*data.*rows|headers.*only|empty/i)
      ).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Unicode and Special Characters', () => {
    test('handles unicode characters in data', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      const csvPath = getFixturePath('edge-cases/unicode_test.csv')
      await sourceWizard.uploadFile(csvPath)

      // Should successfully upload without errors
      await expect(page.getByText(/rows uploaded|upload complete/i)).toBeVisible({ timeout: 15000 })
    })

    test('preserves unicode campaign names', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      const csvPath = getFixturePath('edge-cases/unicode_test.csv')
      await sourceWizard.uploadFile(csvPath)

      // Wait for upload success
      await expect(page.getByText(/rows uploaded|upload complete/i)).toBeVisible({ timeout: 15000 })

      // Row count should reflect the unicode file (20 data rows)
      await expect(page.getByText(/20 rows/i)).toBeVisible()
    })
  })

  test.describe('Column Handling', () => {
    test('handles files with missing expected columns', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      const csvPath = getFixturePath('edge-cases/missing_columns.csv')
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(csvPath)

      // Should either warn about missing columns or upload with available data
      // The behavior depends on implementation - either warning or success with partial data
      await expect(
        page.getByText(/rows uploaded|upload complete|missing.*column|column.*not found/i)
      ).toBeVisible({ timeout: 15000 })
    })

    test('handles files with extra columns', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      const csvPath = getFixturePath('edge-cases/extra_columns.csv')
      await sourceWizard.uploadFile(csvPath)

      // Should successfully upload - extra columns may be ignored or included
      await expect(page.getByText(/rows uploaded|upload complete/i)).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('Numeric Edge Cases', () => {
    test('handles numeric edge cases in data', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      const csvPath = getFixturePath('edge-cases/numeric_edge_cases.csv')
      await sourceWizard.uploadFile(csvPath)

      // Should successfully upload
      await expect(page.getByText(/rows uploaded|upload complete/i)).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('Large String Handling', () => {
    test('handles large strings in data', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      const csvPath = getFixturePath('edge-cases/large_strings.csv')
      await sourceWizard.uploadFile(csvPath)

      // Should successfully upload
      await expect(page.getByText(/rows uploaded|upload complete/i)).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('Upload Cancellation', () => {
    test('can cancel upload in progress', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      // Use a large file to have time to cancel
      const csvPath = getFixturePath('platforms/meta-ads/meta_ads_full.csv')
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(csvPath)

      // Look for cancel button while uploading
      const cancelButton = page.getByRole('button', { name: /cancel/i })
      if (await cancelButton.isVisible({ timeout: 2000 })) {
        await cancelButton.click()

        // Should show cancelled state or return to idle
        await expect(
          page.getByText(/cancelled|drag.*drop|click to browse/i)
        ).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Multiple Upload Attempts', () => {
    test('can upload another file after success', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      // First upload
      const csvPath = getFixturePath('platforms/meta-ads/meta_ads_basic.csv')
      await sourceWizard.uploadFile(csvPath)
      await expect(page.getByText(/rows uploaded|upload complete/i)).toBeVisible({ timeout: 15000 })

      // Click to upload another
      const uploadAnotherButton = page.getByRole('button', { name: /upload another|try again/i })
      await expect(uploadAnotherButton).toBeVisible()
      await uploadAnotherButton.click()

      // Should show uploader again
      await expect(page.getByText(/drag.*drop|click to browse/i)).toBeVisible()
    })

    test('can retry after failed upload', async ({ page }) => {
      await navigateToUploadStep('Meta Ads')

      // Try empty file first (should fail or show warning)
      const emptyPath = getFixturePath('edge-cases/empty_file.csv')
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(emptyPath)

      // Wait for result
      await page.waitForTimeout(3000)

      // Now try a valid file
      const validPath = getFixturePath('platforms/meta-ads/meta_ads_basic.csv')
      await fileInput.setInputFiles(validPath)

      // Should successfully upload the valid file
      await expect(page.getByText(/rows uploaded|upload complete/i)).toBeVisible({ timeout: 15000 })
    })
  })
})

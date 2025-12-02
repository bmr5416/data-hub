/**
 * Source Wizard E2E Tests
 *
 * Tests the 4-step source wizard flow:
 * 1. Platform selection
 * 2. Field configuration
 * 3. Warehouse selection
 * 4. Data upload
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

test.describe('Source Wizard', () => {
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
    // Cleanup test data
    await cleanupByTestId(testId)
  })

  test.describe('Step 1: Platform Selection', () => {
    test.beforeEach(async ({ page }) => {
      // Open the source wizard
      await clientDetailPage.openAddSourceWizard()
      await sourceWizard.waitForWizard()
    })

    test('shows all platform options', async () => {
      // Verify common platforms are visible
      await expect(sourceWizard.getPlatformButton('Meta Ads')).toBeVisible()
      await expect(sourceWizard.getPlatformButton('Google Ads')).toBeVisible()
      await expect(sourceWizard.getPlatformButton('GA4')).toBeVisible()
      await expect(sourceWizard.getPlatformButton('TikTok')).toBeVisible()
      await expect(sourceWizard.getPlatformButton('Shopify')).toBeVisible()
    })

    test('Next button is disabled until platform is selected', async () => {
      await sourceWizard.expectNextDisabled()
    })

    test('selecting a platform enables Next button', async () => {
      await sourceWizard.selectPlatform('Meta Ads')
      await sourceWizard.expectNextEnabled()
    })

    test('can cancel wizard from first step', async () => {
      await sourceWizard.cancel()
      await expect(sourceWizard.dialog).not.toBeVisible()
    })

    test('Back button is not visible on first step', async () => {
      await sourceWizard.expectBackButtonNotVisible()
    })
  })

  test.describe('Step 2: Field Configuration', () => {
    test.beforeEach(async ({ page }) => {
      // Open wizard and advance to step 2
      await clientDetailPage.openAddSourceWizard()
      await sourceWizard.waitForWizard()
      await sourceWizard.selectPlatform('Meta Ads')
      await sourceWizard.clickNext()
    })

    test('shows field configuration step', async () => {
      await sourceWizard.expectFieldConfigurationStep()
    })

    test('Back button is visible on step 2', async () => {
      await sourceWizard.expectBackButtonVisible()
    })

    test('Next button is disabled until configuration is approved', async () => {
      await sourceWizard.expectNextDisabled()
    })

    test('approving configuration enables Next button', async () => {
      await sourceWizard.approveConfiguration()
      await sourceWizard.expectNextEnabled()
    })

    test('can go back to platform selection', async ({ page }) => {
      await sourceWizard.clickBack()
      await sourceWizard.expectPlatformStep()
      // Platform should still be selected
      await expect(sourceWizard.getPlatformButton('Meta Ads')).toHaveAttribute('aria-pressed', 'true')
    })
  })

  test.describe('Step 3: Warehouse Selection', () => {
    test.beforeEach(async ({ page }) => {
      // Open wizard and advance to step 3
      await clientDetailPage.openAddSourceWizard()
      await sourceWizard.waitForWizard()
      await sourceWizard.selectPlatform('Meta Ads')
      await sourceWizard.clickNext()
      await sourceWizard.approveConfiguration()
      await sourceWizard.clickNext()
    })

    test('shows warehouse selection step', async () => {
      await sourceWizard.expectWarehouseStep()
    })

    test('shows all three warehouse options', async () => {
      await expect(sourceWizard.createNewOption).toBeVisible()
      await expect(sourceWizard.existingOption).toBeVisible()
      await expect(sourceWizard.skipOption).toBeVisible()
    })

    test('selecting Skip enables Next immediately', async () => {
      await sourceWizard.selectWarehouseOption('skip')
      await sourceWizard.expectNextEnabled()
    })

    test('can go back to field configuration', async () => {
      await sourceWizard.clickBack()
      await sourceWizard.expectFieldConfigurationStep()
    })
  })

  test.describe('Step 4: Data Upload', () => {
    test.beforeEach(async ({ page }) => {
      // Open wizard and advance to step 4
      await clientDetailPage.openAddSourceWizard()
      await sourceWizard.waitForWizard()
      await sourceWizard.selectPlatform('Meta Ads')
      await sourceWizard.clickNext()
      await sourceWizard.approveConfiguration()
      await sourceWizard.clickNext()
      await sourceWizard.selectWarehouseOption('skip')
      await sourceWizard.clickNext()
    })

    test('shows upload step', async () => {
      await sourceWizard.expectUploadStep()
    })

    test('shows file uploader', async () => {
      await expect(sourceWizard.fileUploader).toBeVisible()
    })

    test('can skip upload and complete wizard', async () => {
      await sourceWizard.skipUpload()
      await sourceWizard.complete()
      await sourceWizard.waitForWizardToClose()
    })

    test('can upload CSV file and complete wizard', async () => {
      const csvPath = getFixturePath('platforms/meta-ads/meta_ads_basic.csv')
      await sourceWizard.uploadFile(csvPath)
      await sourceWizard.expectUploadSuccess()
      await sourceWizard.complete()
      await sourceWizard.waitForWizardToClose()
    })
  })

  test.describe('Full Flow', () => {
    test('completes full wizard with skip options', async () => {
      await clientDetailPage.openAddSourceWizard()
      await sourceWizard.waitForWizard()
      await sourceWizard.completeQuickFlow('Meta Ads')

      // Verify wizard closed
      await expect(sourceWizard.dialog).not.toBeVisible()
    })

    test('cancel at any step closes wizard', async () => {
      await clientDetailPage.openAddSourceWizard()
      await sourceWizard.waitForWizard()

      // Advance to step 2
      await sourceWizard.selectPlatform('Meta Ads')
      await sourceWizard.clickNext()

      // Cancel mid-flow
      await sourceWizard.cancel()
      await expect(sourceWizard.dialog).not.toBeVisible()
    })

    test('back navigation preserves state', async ({ page }) => {
      await clientDetailPage.openAddSourceWizard()
      await sourceWizard.waitForWizard()

      // Complete steps 1-3
      await sourceWizard.selectPlatform('Google Ads')
      await sourceWizard.clickNext()
      await sourceWizard.approveConfiguration()
      await sourceWizard.clickNext()
      await sourceWizard.selectWarehouseOption('skip')
      await sourceWizard.clickNext()

      // Go back through all steps
      await sourceWizard.clickBack() // to step 3
      await sourceWizard.expectWarehouseStep()

      await sourceWizard.clickBack() // to step 2
      await sourceWizard.expectFieldConfigurationStep()

      await sourceWizard.clickBack() // to step 1
      await sourceWizard.expectPlatformStep()

      // Platform should still be selected
      await expect(sourceWizard.getPlatformButton('Google Ads')).toHaveAttribute('aria-pressed', 'true')
    })
  })

  test.describe('Duplicate Platform Warning', () => {
    test('shows warning for duplicate platform', async () => {
      // First, create a source with Meta Ads
      await clientDetailPage.openAddSourceWizard()
      await sourceWizard.waitForWizard()
      await sourceWizard.completeQuickFlow('Meta Ads')

      // Try to add Meta Ads again
      await clientDetailPage.openAddSourceWizard()
      await sourceWizard.waitForWizard()
      await sourceWizard.selectPlatform('Meta Ads')

      // Should show duplicate modal
      await expect(sourceWizard.duplicateModal).toBeVisible()
    })

    test('can continue adding duplicate platform', async () => {
      // First source
      await clientDetailPage.openAddSourceWizard()
      await sourceWizard.waitForWizard()
      await sourceWizard.completeQuickFlow('Meta Ads')

      // Second source (duplicate)
      await clientDetailPage.openAddSourceWizard()
      await sourceWizard.waitForWizard()
      await sourceWizard.selectPlatform('Meta Ads')
      await sourceWizard.continueDuplicate()

      // Should proceed to step 2
      await sourceWizard.expectFieldConfigurationStep()
    })

    test('can cancel duplicate and select different platform', async () => {
      // First source
      await clientDetailPage.openAddSourceWizard()
      await sourceWizard.waitForWizard()
      await sourceWizard.completeQuickFlow('Meta Ads')

      // Try duplicate
      await clientDetailPage.openAddSourceWizard()
      await sourceWizard.waitForWizard()
      await sourceWizard.selectPlatform('Meta Ads')
      await sourceWizard.cancelDuplicate()

      // Should be back on step 1, can select different platform
      await sourceWizard.selectPlatform('Google Ads')
      await sourceWizard.expectNextEnabled()
    })
  })
})

/**
 * Warehouse Wizard E2E Tests
 *
 * Tests the 3-step warehouse creation wizard:
 * 1. Source selection
 * 2. Field selection
 * 3. Review & Create
 */

import { test, expect } from '@playwright/test'
import {
  login,
  getTestId,
  cleanupByTestId,
  createClientViaAPI,
  createSourceViaAPI,
  TEST_EMAIL,
  TEST_PASSWORD,
  ONBOARDING_KEY,
  clientDetailRoute,
} from '../fixtures/e2e-helpers'
import { ClientDetailPage, WarehouseWizardPage } from '../pages'

test.describe('Warehouse Wizard', () => {
  let testId: string
  let clientId: string
  let clientDetailPage: ClientDetailPage
  let warehouseWizard: WarehouseWizardPage

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
    warehouseWizard = new WarehouseWizardPage(page)
  })

  test.afterEach(async () => {
    // Cleanup test data
    await cleanupByTestId(testId)
  })

  test.describe('Empty State', () => {
    test('shows no sources message when client has no sources', async () => {
      await clientDetailPage.openWarehouseWizard()
      await warehouseWizard.waitForWizard()

      // Should show empty state message
      await warehouseWizard.expectNoSourcesMessage()
    })

    test('Next button is disabled without sources', async () => {
      await clientDetailPage.openWarehouseWizard()
      await warehouseWizard.waitForWizard()

      await warehouseWizard.expectNextDisabled()
    })
  })

  test.describe('With Sources', () => {
    test.beforeEach(async () => {
      // Create a source for the client via API
      await createSourceViaAPI(clientId, testId, 'meta_ads')
    })

    test.describe('Step 1: Source Selection', () => {
      test.beforeEach(async ({ page }) => {
        // Refresh to pick up new source
        await page.reload()
        await page.waitForLoadState('networkidle')

        await clientDetailPage.openWarehouseWizard()
        await warehouseWizard.waitForWizard()
      })

      test('shows available sources', async () => {
        await expect(warehouseWizard.sourceList).toBeVisible()
      })

      test('Next button is disabled until platform is selected', async () => {
        await warehouseWizard.expectNextDisabled()
      })

      test('selecting a platform enables Next button', async () => {
        await warehouseWizard.selectPlatform('Meta Ads')
        await warehouseWizard.expectNextEnabled()
      })

      test('can cancel wizard from first step', async () => {
        await warehouseWizard.cancel()
        await expect(warehouseWizard.dialog).not.toBeVisible()
      })

      test('Back button is not visible on first step', async () => {
        await warehouseWizard.expectBackButtonNotVisible()
      })

      test('selected count updates when selecting platforms', async () => {
        await warehouseWizard.selectPlatform('Meta Ads')
        const count = await warehouseWizard.getSelectedCount()
        expect(count).toBeGreaterThan(0)
      })
    })

    test.describe('Step 2: Field Selection', () => {
      test.beforeEach(async ({ page }) => {
        // Refresh to pick up new source
        await page.reload()
        await page.waitForLoadState('networkidle')

        // Open wizard and advance to step 2
        await clientDetailPage.openWarehouseWizard()
        await warehouseWizard.waitForWizard()
        await warehouseWizard.selectPlatform('Meta Ads')
        await warehouseWizard.clickNext()
      })

      test('shows field selection step', async () => {
        await warehouseWizard.expectFieldSelectionStep()
      })

      test('Back button is visible on step 2', async () => {
        await warehouseWizard.expectBackButtonVisible()
      })

      test('Use Recommended button is visible', async () => {
        await expect(warehouseWizard.useRecommendedButton).toBeVisible()
      })

      test('clicking Use Recommended enables Next', async () => {
        await warehouseWizard.useRecommendedFields()
        await warehouseWizard.expectNextEnabled()
      })

      test('can go back to source selection', async () => {
        await warehouseWizard.clickBack()
        await warehouseWizard.expectSourceSelectionStep()
        // Platform should still be selected
        await warehouseWizard.expectPlatformSelected('Meta Ads')
      })
    })

    test.describe('Step 3: Review & Create', () => {
      test.beforeEach(async ({ page }) => {
        // Refresh to pick up new source
        await page.reload()
        await page.waitForLoadState('networkidle')

        // Open wizard and advance to step 3
        await clientDetailPage.openWarehouseWizard()
        await warehouseWizard.waitForWizard()
        await warehouseWizard.selectPlatform('Meta Ads')
        await warehouseWizard.clickNext()
        await warehouseWizard.useRecommendedFields()
        await warehouseWizard.clickNext()
      })

      test('shows review step', async () => {
        await warehouseWizard.expectReviewStep()
      })

      test('warehouse name input is visible', async () => {
        await expect(warehouseWizard.warehouseNameInput).toBeVisible()
      })

      test('blended table checkbox is visible', async () => {
        await expect(warehouseWizard.blendedTableCheckbox).toBeVisible()
      })

      test('can set custom warehouse name', async () => {
        const customName = `Test Warehouse ${testId}`
        await warehouseWizard.setWarehouseName(customName)
        const name = await warehouseWizard.getWarehouseName()
        expect(name).toBe(customName)
      })

      test('can toggle blended table option', async () => {
        // Toggle off and verify
        await warehouseWizard.uncheckBlendedTable()
        await expect(warehouseWizard.blendedTableCheckbox).not.toBeChecked()

        // Toggle back on
        await warehouseWizard.checkBlendedTable()
        await expect(warehouseWizard.blendedTableCheckbox).toBeChecked()
      })
    })

    test.describe('Full Flow', () => {
      test.beforeEach(async ({ page }) => {
        // Refresh to pick up new source
        await page.reload()
        await page.waitForLoadState('networkidle')
      })

      test('completes single-platform warehouse with recommended fields', async () => {
        await clientDetailPage.openWarehouseWizard()
        await warehouseWizard.waitForWizard()

        await warehouseWizard.completeQuickFlow({
          platform: 'Meta Ads',
          name: `Test Warehouse ${testId}`,
        })

        // Verify wizard closed
        await expect(warehouseWizard.dialog).not.toBeVisible()
      })

      test('cancel at any step closes wizard', async () => {
        await clientDetailPage.openWarehouseWizard()
        await warehouseWizard.waitForWizard()

        // Advance to step 2
        await warehouseWizard.selectPlatform('Meta Ads')
        await warehouseWizard.clickNext()

        // Cancel mid-flow
        await warehouseWizard.cancel()
        await expect(warehouseWizard.dialog).not.toBeVisible()
      })

      test('back navigation preserves state', async ({ page }) => {
        await clientDetailPage.openWarehouseWizard()
        await warehouseWizard.waitForWizard()

        // Complete steps 1-2
        await warehouseWizard.selectPlatform('Meta Ads')
        await warehouseWizard.clickNext()
        await warehouseWizard.useRecommendedFields()
        await warehouseWizard.clickNext()

        // Go back through all steps
        await warehouseWizard.clickBack() // to step 2
        await warehouseWizard.expectFieldSelectionStep()

        await warehouseWizard.clickBack() // to step 1
        await warehouseWizard.expectSourceSelectionStep()

        // Platform should still be selected
        await warehouseWizard.expectPlatformSelected('Meta Ads')
      })
    })
  })

  test.describe('Multi-Platform Warehouse', () => {
    test.beforeEach(async ({ page }) => {
      // Create multiple sources for the client
      await createSourceViaAPI(clientId, testId, 'meta_ads')
      await createSourceViaAPI(clientId, testId, 'google_ads')

      // Refresh to pick up new sources
      await page.reload()
      await page.waitForLoadState('networkidle')
    })

    test('can select multiple platforms', async () => {
      await clientDetailPage.openWarehouseWizard()
      await warehouseWizard.waitForWizard()

      await warehouseWizard.selectPlatform('Meta Ads')
      await warehouseWizard.selectPlatform('Google Ads')

      const count = await warehouseWizard.getSelectedCount()
      expect(count).toBe(2)
    })

    test('completes blended warehouse with multiple platforms', async () => {
      await clientDetailPage.openWarehouseWizard()
      await warehouseWizard.waitForWizard()

      await warehouseWizard.completeFullFlow({
        platforms: ['Meta Ads', 'Google Ads'],
        name: `Blended Warehouse ${testId}`,
        includeBlended: true,
      })

      // Verify wizard closed
      await expect(warehouseWizard.dialog).not.toBeVisible()
    })

    test('shows platform tabs in field selection step', async () => {
      await clientDetailPage.openWarehouseWizard()
      await warehouseWizard.waitForWizard()

      await warehouseWizard.selectPlatform('Meta Ads')
      await warehouseWizard.selectPlatform('Google Ads')
      await warehouseWizard.clickNext()

      // Should see tabs for each platform
      await expect(warehouseWizard.platformTabs.getByRole('tab', { name: /meta/i })).toBeVisible()
      await expect(warehouseWizard.platformTabs.getByRole('tab', { name: /google/i })).toBeVisible()
    })
  })
})

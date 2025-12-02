/**
 * Critical Path Smoke Test
 *
 * End-to-end test that validates the core Data Hub user journey:
 * 1. Dashboard is accessible (no login required)
 * 2. Create client
 * 3. Navigate to client detail
 * 4. Edit client details
 * 5. Navigate tabs
 * 6. Verify client on dashboard
 *
 * This test runs quickly and validates the most critical user flows.
 * Cleanup is handled via API in afterEach.
 */

import { test, expect } from '@playwright/test'
import { DashboardPage, ClientDetailPage } from '../pages'
import { getTestId, cleanupByTestId, login, ROUTES } from '../fixtures/e2e-helpers'

const ONBOARDING_KEY = 'datahub_onboarding_complete'

// Test isolation
let testId: string

test.describe('Critical Path - End-to-End Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    // Generate unique test ID for isolation
    testId = getTestId()

    // Skip onboarding via localStorage before login
    await page.goto(ROUTES.LOGIN)
    await page.evaluate((key) => localStorage.setItem(key, '1'), ONBOARDING_KEY)

    // Login and navigate to dashboard
    await login(page)
  })

  test.afterEach(async () => {
    // Clean up any test data via API (fast)
    await cleanupByTestId(testId)
  })

  test('complete user journey: create client -> edit -> delete', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    const clientDetail = new ClientDetailPage(page)

    // Test data
    const clientData = {
      name: `Smoke Test Client [${testId}]`,
      email: `smoke-${testId}@test.local`,
      industry: 'Technology',
      notes: 'Created by E2E smoke test',
    }

    // ========================================================================
    // Step 1: Dashboard loads (after login)
    // ========================================================================
    await test.step('Dashboard is accessible', async () => {
      await dashboard.waitForLoad()
      await expect(dashboard.heading).toBeVisible()
      await expect(dashboard.addClientButton).toBeVisible()
    })

    // ========================================================================
    // Step 2: Create a new client
    // ========================================================================
    await test.step('Create a new client', async () => {
      await dashboard.createClient(clientData)

      // Should navigate to client detail page
      await page.waitForURL(/\/dashboard\/clients\//)
    })

    // ========================================================================
    // Step 3: Client detail page loads correctly
    // ========================================================================
    await test.step('Client detail page displays client info', async () => {
      await clientDetail.waitForLoad()

      const clientName = await clientDetail.getClientName()
      expect(clientName).toContain(clientData.name)
    })

    // ========================================================================
    // Step 4: Edit client details
    // ========================================================================
    await test.step('Edit client details via modal', async () => {
      const updatedName = `Updated Smoke Client [${testId}]`

      await clientDetail.openEditClientModal()
      await clientDetail.fillEditForm({
        name: updatedName,
        status: 'active',
      })
      await clientDetail.saveEditChanges()

      // Verify update persisted
      await page.waitForLoadState('networkidle')
      const newName = await clientDetail.getClientName()
      expect(newName).toContain(updatedName)
    })

    // ========================================================================
    // Step 5: Navigate tabs
    // ========================================================================
    await test.step('Navigate between tabs', async () => {
      // Check that tabs are accessible
      await clientDetail.clickTab('sources')
      await expect(clientDetail.addSourceButton).toBeVisible()

      await clientDetail.clickTab('reports')
      await expect(clientDetail.addReportButton).toBeVisible()

      await clientDetail.clickTab('warehouse')
      await expect(clientDetail.createWarehouseButton).toBeVisible()
    })

    // ========================================================================
    // Step 6: Return to dashboard and verify client
    // ========================================================================
    await test.step('Navigate back to dashboard and verify client exists', async () => {
      await page.goto(ROUTES.DASHBOARD)
      await dashboard.waitForLoad()

      // Client should be visible on dashboard
      await dashboard.expectClientVisible(`Updated Smoke Client [${testId}]`)
    })

    // Note: Delete client UI is not yet implemented in the application.
    // Cleanup is handled automatically by afterEach via API.
  })

  test('dashboard stats update correctly', async ({ page }) => {
    const dashboard = new DashboardPage(page)

    // Dashboard should be ready (setup done in beforeEach)
    await dashboard.waitForLoad()

    // Get initial stats
    const initialTotal = await dashboard.getStatValue('total')

    // Create a client
    await dashboard.createClient({
      name: `Stats Test Client [${testId}]`,
      email: `stats-${testId}@test.local`,
      industry: 'SaaS',
    })

    // Navigate back to dashboard
    await page.goto(ROUTES.DASHBOARD)
    await dashboard.waitForLoad()

    // Stats should increment - use toBeGreaterThan to handle potential race conditions
    // with parallel tests that might also be creating/deleting clients
    const newTotal = await dashboard.getStatValue('total')
    expect(newTotal).toBeGreaterThanOrEqual(initialTotal + 1)
  })

  test('empty state displays correctly for new user', async ({ page }) => {
    const dashboard = new DashboardPage(page)

    // Dashboard should be ready (setup done in beforeEach)
    await dashboard.waitForLoad()

    // Verify dashboard components are present
    await expect(dashboard.heading).toContainText(/dashboard/i)
    await expect(dashboard.addClientButton).toBeVisible()

    // Stats cards should be present
    await expect(dashboard.totalClientsCard).toBeVisible()
    await expect(dashboard.activeClientsCard).toBeVisible()
  })
})

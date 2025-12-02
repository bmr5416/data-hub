/**
 * Report Delivery E2E Tests
 *
 * Tests report detail modal functionality:
 * - Tab navigation (overview, visualizations, schedule, delivery, alerts)
 * - Report editing and deletion
 * - Test email delivery
 * - Alert management (create, toggle, delete)
 * - Visualization management
 */

import { test, expect } from '@playwright/test'
import {
  login,
  getTestId,
  cleanupByTestId,
  createClientViaAPI,
  createWarehouseViaAPI,
  createReportViaAPI,
  TEST_EMAIL,
  TEST_PASSWORD,
  ONBOARDING_KEY,
  clientDetailRoute,
} from '../fixtures/e2e-helpers'
import { ClientDetailPage, ReportDetailPage } from '../pages'

test.describe('Report Detail Modal', () => {
  let testId: string
  let clientId: string
  let warehouseId: string
  let reportId: string
  let clientDetailPage: ClientDetailPage
  let reportDetailPage: ReportDetailPage

  test.beforeEach(async ({ page }) => {
    testId = getTestId()

    // Authenticate
    await login(page, TEST_EMAIL, TEST_PASSWORD)

    // Skip onboarding
    await page.evaluate((key) => localStorage.setItem(key, '1'), ONBOARDING_KEY)

    // Create test data via API
    const client = await createClientViaAPI(testId)
    clientId = client.id

    const warehouse = await createWarehouseViaAPI(clientId, testId, ['meta_ads'])
    warehouseId = warehouse.id

    const report = await createReportViaAPI(clientId, warehouseId, testId)
    reportId = report.id

    // Navigate to client detail page
    await page.goto(clientDetailRoute(clientId))
    await page.waitForLoadState('networkidle')

    // Initialize page objects
    clientDetailPage = new ClientDetailPage(page)
    reportDetailPage = new ReportDetailPage(page)
  })

  test.afterEach(async () => {
    await cleanupByTestId(testId)
  })

  test.describe('Tab Navigation', () => {
    test('opens report detail modal from reports tab', async ({ page }) => {
      // Navigate to reports tab
      await clientDetailPage.clickTab('Reports')

      // Click on the report row to open detail modal
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()

      // Wait for modal
      await reportDetailPage.waitForModal()

      // Verify overview tab is active by default
      await expect(reportDetailPage.overviewTab).toHaveClass(/activeTab/)
    })

    test('navigates between all tabs', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      // Test each tab
      const tabs = ['visualizations', 'schedule', 'delivery', 'alerts', 'overview'] as const

      for (const tab of tabs) {
        await reportDetailPage.clickTab(tab)
        await reportDetailPage.expectTab(tab)
      }
    })

    test('closes modal with close button', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      await reportDetailPage.close()
      await expect(reportDetailPage.modal).not.toBeVisible()
    })
  })

  test.describe('Overview Tab', () => {
    test('displays report statistics', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      // Verify stat cards are visible
      await expect(reportDetailPage.visualizationCount).toBeVisible()
      await expect(reportDetailPage.frequencyDisplay).toBeVisible()
      await expect(reportDetailPage.formatDisplay).toBeVisible()
      await expect(reportDetailPage.recipientCount).toBeVisible()
    })

    test('shows correct visualization count', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      const count = await reportDetailPage.getVisualizationCount()
      expect(count).toBe(0) // New report has no visualizations
    })

    test('shows frequency as On Demand for new report', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      const frequency = await reportDetailPage.getFrequency()
      expect(frequency).toContain('On Demand')
    })
  })

  test.describe('Report Editing', () => {
    test('can edit report name', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      // Start editing
      await reportDetailPage.startEdit()

      // Set new name
      const newName = `Renamed Report [${testId}]`
      await reportDetailPage.setReportName(newName)

      // Save
      await reportDetailPage.saveEdit()

      // Verify name was updated (close and reopen)
      await reportDetailPage.close()

      // Verify new name appears in list
      await expect(page.getByText(newName)).toBeVisible()
    })

    test('can cancel editing', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      await reportDetailPage.startEdit()
      await reportDetailPage.setReportName('Should Not Save')
      await reportDetailPage.cancelEdit()

      // Verify original name is still shown
      await expect(reportDetailPage.editButton).toBeVisible()
    })
  })

  test.describe('Delivery Tab', () => {
    test('displays delivery options', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      await reportDetailPage.goToDeliveryTab()

      // Verify delivery controls are visible
      await expect(reportDetailPage.testEmailInput).toBeVisible()
      await expect(reportDetailPage.sendTestButton).toBeVisible()
    })

    test('test email button is disabled without email', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      await reportDetailPage.goToDeliveryTab()

      // Button should be disabled when email input is empty
      await expect(reportDetailPage.sendTestButton).toBeDisabled()
    })

    test('test email button is enabled with valid email', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      await reportDetailPage.goToDeliveryTab()

      // Enter an email
      await reportDetailPage.testEmailInput.fill('test@example.com')

      // Button should now be enabled
      await expect(reportDetailPage.sendTestButton).toBeEnabled()
    })

    // Skip test if SMTP is not configured
    test('can send test email (requires SMTP config)', async ({ page }) => {
      test.skip(!process.env.SMTP_HOST, 'SMTP not configured');
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      await reportDetailPage.goToDeliveryTab()
      await reportDetailPage.sendTestEmail('test@example.com')

      // Should show result (success or error depending on SMTP config)
      await expect(reportDetailPage.sendResult).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Visualizations Tab', () => {
    test('shows empty state for new report', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      await reportDetailPage.goToVisualizationsTab()

      // Should show empty state
      await expect(reportDetailPage.vizEmptyState).toBeVisible()
    })

    test('displays add visualization buttons', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      await reportDetailPage.goToVisualizationsTab()

      // All add buttons should be visible
      await expect(reportDetailPage.addKPIButton).toBeVisible()
      await expect(reportDetailPage.addBarChartButton).toBeVisible()
      await expect(reportDetailPage.addLineChartButton).toBeVisible()
      await expect(reportDetailPage.addPieChartButton).toBeVisible()
    })

    test('can open add KPI modal', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      await reportDetailPage.goToVisualizationsTab()
      await reportDetailPage.addKPIButton.click()

      // Viz modal should open
      await expect(reportDetailPage.vizModal).toBeVisible()
      await expect(reportDetailPage.vizTitleInput).toBeVisible()
    })

    test('can cancel visualization modal', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      await reportDetailPage.goToVisualizationsTab()
      await reportDetailPage.addKPIButton.click()
      await expect(reportDetailPage.vizModal).toBeVisible()

      await reportDetailPage.cancelVizModal()
      await expect(reportDetailPage.vizModal).not.toBeVisible()
    })

    test('can add a KPI card', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      await reportDetailPage.goToVisualizationsTab()
      await reportDetailPage.addKPI({ title: 'Test KPI' })

      // Empty state should be gone
      await expect(reportDetailPage.vizEmptyState).not.toBeVisible()

      // Viz grid should show the new KPI
      await expect(page.getByText('Test KPI')).toBeVisible()
    })
  })

  test.describe('Alerts Tab', () => {
    test('shows empty state when no alerts', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      await reportDetailPage.goToAlertsTab()

      await expect(reportDetailPage.alertEmptyState).toBeVisible()
    })

    test('can open add alert form', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      await reportDetailPage.goToAlertsTab()
      await reportDetailPage.openAddAlert()

      await expect(reportDetailPage.alertForm).toBeVisible()
      await expect(reportDetailPage.alertTypeSelect).toBeVisible()
    })

    test('can create metric threshold alert', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      await reportDetailPage.goToAlertsTab()
      await reportDetailPage.createThresholdAlert({
        metric: 'spend',
        condition: 'gt',
        threshold: 1000,
      })

      // Alert should appear in list
      await expect(page.getByText(/spend.*>/i)).toBeVisible()
      await expect(reportDetailPage.alertEmptyState).not.toBeVisible()
    })

    test('can toggle alert status', async ({ page }) => {
      // First create an alert
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      await reportDetailPage.goToAlertsTab()
      await reportDetailPage.createThresholdAlert({
        metric: 'impressions',
        threshold: 50000,
      })

      // Toggle the alert
      await reportDetailPage.toggleAlert(0)

      // Status should change (either to enabled or disabled)
      await expect(
        page.getByRole('button', { name: /enable|disable/i })
      ).toBeVisible()
    })
  })

  test.describe('Schedule Tab', () => {
    test('displays schedule information', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      await reportDetailPage.goToScheduleTab()
      await reportDetailPage.expectScheduleInfo()
    })
  })

  test.describe('Report Deletion', () => {
    test('can delete a report', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      // Delete the report
      await reportDetailPage.deleteReport()

      // Modal should close
      await expect(reportDetailPage.modal).not.toBeVisible()

      // Report should no longer appear in list
      await expect(page.getByText(new RegExp(`Test Report.*${testId}`))).not.toBeVisible()
    })

    test('delete requires confirmation', async ({ page }) => {
      await clientDetailPage.clickTab('Reports')
      await page.getByText(new RegExp(`Test Report.*${testId}`)).click()
      await reportDetailPage.waitForModal()

      // First click on delete
      await reportDetailPage.deleteButton.click()

      // Should show confirm delete button
      await expect(reportDetailPage.confirmDeleteButton).toBeVisible()

      // Close modal without confirming
      await page.keyboard.press('Escape')
    })
  })
})

test.describe('Report Delivery - Multiple Reports', () => {
  let testId: string
  let clientId: string
  let warehouseId: string

  test.beforeEach(async ({ page }) => {
    testId = getTestId()

    await login(page, TEST_EMAIL, TEST_PASSWORD)
    await page.evaluate((key) => localStorage.setItem(key, '1'), ONBOARDING_KEY)

    const client = await createClientViaAPI(testId)
    clientId = client.id

    const warehouse = await createWarehouseViaAPI(clientId, testId)
    warehouseId = warehouse.id

    // Create multiple reports
    await createReportViaAPI(clientId, warehouseId, testId + '-1')
    await createReportViaAPI(clientId, warehouseId, testId + '-2')

    await page.goto(clientDetailRoute(clientId))
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async () => {
    await cleanupByTestId(testId)
  })

  test('can switch between reports', async ({ page }) => {
    const clientDetailPage = new ClientDetailPage(page)
    const reportDetailPage = new ReportDetailPage(page)

    await clientDetailPage.clickTab('Reports')

    // Open first report
    await page.getByText(new RegExp(`Test Report.*${testId}-1`)).click()
    await reportDetailPage.waitForModal()
    await expect(page.getByRole('dialog')).toContainText(testId + '-1')

    // Close and open second report
    await reportDetailPage.close()
    await page.getByText(new RegExp(`Test Report.*${testId}-2`)).click()
    await reportDetailPage.waitForModal()
    await expect(page.getByRole('dialog')).toContainText(testId + '-2')
  })
})

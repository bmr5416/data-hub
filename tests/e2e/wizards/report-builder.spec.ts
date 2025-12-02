/**
 * Report Builder Wizard E2E Tests
 *
 * Tests the 4-step report builder wizard:
 * 1. Data Source
 * 2. Visualizations
 * 3. Schedule
 * 4. Review
 */

import { test, expect } from '@playwright/test'
import {
  login,
  getTestId,
  cleanupByTestId,
  createClientViaAPI,
  createSourceViaAPI,
  createWarehouseViaAPI,
  TEST_EMAIL,
  TEST_PASSWORD,
  ONBOARDING_KEY,
  clientDetailRoute,
} from '../fixtures/e2e-helpers'
import { ClientDetailPage, ReportBuilderPage } from '../pages'

test.describe('Report Builder Wizard', () => {
  let testId: string
  let clientId: string
  let clientDetailPage: ClientDetailPage
  let reportBuilder: ReportBuilderPage

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
    reportBuilder = new ReportBuilderPage(page)
  })

  test.afterEach(async () => {
    // Cleanup test data
    await cleanupByTestId(testId)
  })

  test.describe('Empty State', () => {
    test('shows no warehouse message when client has no warehouses', async () => {
      await clientDetailPage.openReportBuilder()
      await reportBuilder.waitForWizard()

      // Should show empty state message
      await reportBuilder.expectNoWarehouseMessage()
    })
  })

  test.describe('With Warehouse', () => {
    let warehouseId: string
    let warehouseName: string

    test.beforeEach(async ({ page }) => {
      // Create a source and warehouse for the client via API
      await createSourceViaAPI(clientId, testId, 'meta_ads')
      const warehouse = await createWarehouseViaAPI(clientId, testId, ['meta_ads'])
      warehouseId = warehouse.id
      warehouseName = warehouse.name

      // Refresh to pick up new data
      await page.reload()
      await page.waitForLoadState('networkidle')
    })

    test.describe('Step 1: Data Source', () => {
      test.beforeEach(async () => {
        await clientDetailPage.openReportBuilder()
        await reportBuilder.waitForWizard()
      })

      test('shows data source step', async () => {
        await reportBuilder.expectDataSourceStep()
      })

      test('auto-selects first warehouse', async () => {
        // Warehouse should be pre-selected (first one)
        await reportBuilder.expectNextEnabled()
      })

      test('can select different warehouse', async () => {
        await reportBuilder.selectWarehouse(warehouseName)
        await reportBuilder.expectNextEnabled()
      })

      test('can select date range', async () => {
        await reportBuilder.selectDateRange('last 7 days')
        await reportBuilder.expectNextEnabled()
      })

      test('can cancel wizard from first step', async () => {
        await reportBuilder.cancel()
        await expect(reportBuilder.dialog).not.toBeVisible()
      })
    })

    test.describe('Step 2: Visualizations', () => {
      test.beforeEach(async () => {
        await clientDetailPage.openReportBuilder()
        await reportBuilder.waitForWizard()
        await reportBuilder.clickNext() // Advance to step 2
      })

      test('shows visualizations step', async () => {
        await reportBuilder.expectVisualizationsStep()
      })

      test('shows add visualization buttons', async () => {
        await expect(reportBuilder.addKPIButton).toBeVisible()
      })

      test('Next button is disabled without visualizations', async () => {
        await reportBuilder.expectNextDisabled()
      })

      test('can add KPI card', async () => {
        await reportBuilder.addKPI({ title: 'Total Spend' })
        await reportBuilder.expectNextEnabled()
      })

      test('clicking add KPI opens modal', async () => {
        await reportBuilder.openAddKPI()
        await expect(reportBuilder.vizModal).toBeVisible()
      })

      test('can cancel visualization modal', async () => {
        await reportBuilder.openAddKPI()
        await reportBuilder.cancelVizModal()
        await expect(reportBuilder.vizModal).not.toBeVisible()
      })

      test('can remove visualization', async () => {
        await reportBuilder.addKPI({ title: 'Test KPI' })
        const initialCount = await reportBuilder.getVisualizationCount()

        await reportBuilder.removeVisualization(0)
        const finalCount = await reportBuilder.getVisualizationCount()

        expect(finalCount).toBeLessThan(initialCount)
      })

      test('can go back to data source step', async () => {
        await reportBuilder.clickBack()
        await reportBuilder.expectDataSourceStep()
      })
    })

    test.describe('Step 3: Schedule', () => {
      test.beforeEach(async () => {
        await clientDetailPage.openReportBuilder()
        await reportBuilder.waitForWizard()
        await reportBuilder.clickNext() // to step 2
        await reportBuilder.addKPI({ title: 'Total Spend' })
        await reportBuilder.clickNext() // to step 3
      })

      test('shows schedule step', async () => {
        await reportBuilder.expectScheduleStep()
      })

      test('on-demand is default frequency', async () => {
        await expect(reportBuilder.frequencyOnDemand).toBeChecked()
      })

      test('on-demand does not require recipients', async () => {
        await reportBuilder.selectFrequency('on_demand')
        await reportBuilder.expectNextEnabled()
      })

      test('scheduled reports require recipients', async () => {
        await reportBuilder.selectFrequency('weekly')
        await reportBuilder.expectNextDisabled()

        await reportBuilder.addRecipient('test@example.com')
        await reportBuilder.expectNextEnabled()
      })

      test('can add multiple recipients', async () => {
        await reportBuilder.selectFrequency('weekly')
        await reportBuilder.addRecipient('test1@example.com')
        await reportBuilder.addRecipient('test2@example.com')

        const count = await reportBuilder.getRecipientCount()
        expect(count).toBe(2)
      })

      test('can remove recipient', async () => {
        await reportBuilder.selectFrequency('weekly')
        await reportBuilder.addRecipient('test@example.com')
        await reportBuilder.removeRecipient(0)

        const count = await reportBuilder.getRecipientCount()
        expect(count).toBe(0)
      })

      test('shows error for invalid email', async () => {
        await reportBuilder.selectFrequency('weekly')
        await reportBuilder.recipientInput.fill('invalid-email')
        await reportBuilder.addRecipientButton.click()

        await reportBuilder.expectEmailError()
      })
    })

    test.describe('Step 4: Review', () => {
      test.beforeEach(async () => {
        await clientDetailPage.openReportBuilder()
        await reportBuilder.waitForWizard()
        await reportBuilder.clickNext() // to step 2
        await reportBuilder.addKPI({ title: 'Total Spend' })
        await reportBuilder.clickNext() // to step 3
        await reportBuilder.selectFrequency('on_demand')
        await reportBuilder.clickNext() // to step 4
      })

      test('shows review step', async () => {
        await reportBuilder.expectReviewStep()
      })

      test('report name input is visible', async () => {
        await expect(reportBuilder.reportNameInput).toBeVisible()
      })

      test('Complete button is disabled without report name', async () => {
        // Clear any default name
        await reportBuilder.reportNameInput.clear()
        await expect(reportBuilder.completeButton).toBeDisabled()
      })

      test('can set report name', async () => {
        const reportName = `Test Report ${testId}`
        await reportBuilder.setReportName(reportName)
        const name = await reportBuilder.getReportName()
        expect(name).toBe(reportName)
      })

      test('Complete button is enabled with report name', async () => {
        await reportBuilder.setReportName(`Test Report ${testId}`)
        await expect(reportBuilder.completeButton).toBeEnabled()
      })
    })

    test.describe('Full Flow', () => {
      test('completes on-demand report', async () => {
        await clientDetailPage.openReportBuilder()
        await reportBuilder.waitForWizard()

        await reportBuilder.completeQuickFlow({
          warehouseName,
          reportName: `On-Demand Report ${testId}`,
          kpiTitle: 'Total Spend',
        })

        // Verify wizard closed
        await expect(reportBuilder.dialog).not.toBeVisible()
      })

      test('completes scheduled weekly report', async () => {
        await clientDetailPage.openReportBuilder()
        await reportBuilder.waitForWizard()

        await reportBuilder.completeScheduledFlow({
          warehouseName,
          reportName: `Weekly Report ${testId}`,
          kpiTitle: 'Weekly Spend',
          frequency: 'weekly',
          recipients: ['test@example.com'],
        })

        // Verify wizard closed
        await expect(reportBuilder.dialog).not.toBeVisible()
      })

      test('cancel at any step closes wizard', async () => {
        await clientDetailPage.openReportBuilder()
        await reportBuilder.waitForWizard()

        // Advance to step 2
        await reportBuilder.clickNext()

        // Cancel mid-flow
        await reportBuilder.cancel()
        await expect(reportBuilder.dialog).not.toBeVisible()
      })

      test('back navigation preserves state', async () => {
        await clientDetailPage.openReportBuilder()
        await reportBuilder.waitForWizard()

        // Complete steps 1-3
        await reportBuilder.clickNext() // to step 2
        await reportBuilder.addKPI({ title: 'Test KPI' })
        await reportBuilder.clickNext() // to step 3
        await reportBuilder.selectFrequency('on_demand')
        await reportBuilder.clickNext() // to step 4

        // Go back through all steps
        await reportBuilder.clickBack() // to step 3
        await reportBuilder.expectScheduleStep()

        await reportBuilder.clickBack() // to step 2
        await reportBuilder.expectVisualizationsStep()
        // KPI should still be there
        const count = await reportBuilder.getVisualizationCount()
        expect(count).toBeGreaterThan(0)

        await reportBuilder.clickBack() // to step 1
        await reportBuilder.expectDataSourceStep()
      })
    })
  })

  test.describe('Visualization Types', () => {
    let warehouseName: string

    test.beforeEach(async ({ page }) => {
      // Create a source and warehouse for the client via API
      await createSourceViaAPI(clientId, testId, 'meta_ads')
      const warehouse = await createWarehouseViaAPI(clientId, testId, ['meta_ads'])
      warehouseName = warehouse.name

      // Refresh and open wizard to step 2
      await page.reload()
      await page.waitForLoadState('networkidle')

      await clientDetailPage.openReportBuilder()
      await reportBuilder.waitForWizard()
      await reportBuilder.clickNext() // to step 2
    })

    test('can add bar chart', async () => {
      await reportBuilder.addBarChart({ title: 'Spend by Day' })
      const count = await reportBuilder.getVisualizationCount()
      expect(count).toBe(1)
    })

    test('can add multiple visualization types', async () => {
      await reportBuilder.addKPI({ title: 'Total Spend' })
      await reportBuilder.addBarChart({ title: 'Spend by Day' })

      const count = await reportBuilder.getVisualizationCount()
      expect(count).toBe(2)
    })
  })
})

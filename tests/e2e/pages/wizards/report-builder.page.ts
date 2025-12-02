/**
 * Report Builder Wizard Page Object
 *
 * Represents the 4-step report builder wizard:
 * 1. Data Source
 * 2. Visualizations
 * 3. Schedule
 * 4. Review
 */

import { Page, Locator, expect } from '@playwright/test'

export class ReportBuilderPage {
  readonly page: Page

  // Modal container (wizard is rendered inside Modal with role="dialog")
  readonly dialog: Locator

  // Wizard header
  readonly title: Locator
  readonly subtitle: Locator

  // Progress indicators
  readonly progressBar: Locator

  // Navigation buttons (scoped to dialog)
  readonly nextButton: Locator
  readonly backButton: Locator
  readonly cancelButton: Locator
  readonly completeButton: Locator

  // Step 1: Data Source
  readonly warehouseSelect: Locator
  readonly dateRangeSelect: Locator
  readonly noWarehouseMessage: Locator
  readonly platformList: Locator

  // Step 2: Visualizations
  readonly addKPIButton: Locator
  readonly addBarChartButton: Locator
  readonly addLineChartButton: Locator
  readonly addPieChartButton: Locator
  readonly visualizationList: Locator
  readonly emptyStateMessage: Locator

  // Visualization modal (appears when adding/editing)
  readonly vizModal: Locator
  readonly vizTitleInput: Locator
  readonly vizMetricSelect: Locator
  readonly vizSaveButton: Locator
  readonly vizCancelButton: Locator

  // Step 3: Schedule
  readonly frequencyOnDemand: Locator
  readonly frequencyDaily: Locator
  readonly frequencyWeekly: Locator
  readonly frequencyMonthly: Locator
  readonly recipientInput: Locator
  readonly addRecipientButton: Locator
  readonly recipientList: Locator
  readonly deliveryFormatSelect: Locator
  readonly timeInput: Locator
  readonly daySelect: Locator

  // Step 4: Review
  readonly reportNameInput: Locator
  readonly reportSummary: Locator
  readonly previewSection: Locator

  constructor(page: Page) {
    this.page = page

    // Main dialog container - all locators scoped to this
    this.dialog = page.getByRole('dialog')

    // Wizard header
    this.title = this.dialog.getByRole('heading', { name: /build report/i })
    this.subtitle = this.dialog.getByText(/create a visual report/i)

    // Progress bar
    this.progressBar = this.dialog.locator('[class*="WizardProgress"]')

    // Navigation buttons
    this.nextButton = this.dialog.getByRole('button', { name: /next/i })
    this.backButton = this.dialog.getByRole('button', { name: /back/i })
    this.cancelButton = this.dialog.getByRole('button', { name: /cancel/i })
    this.completeButton = this.dialog.getByRole('button', { name: 'Complete', exact: true })

    // Step 1: Data Source
    this.warehouseSelect = this.dialog.getByRole('combobox', { name: /warehouse/i })
    this.dateRangeSelect = this.dialog.getByRole('combobox', { name: /date range/i })
    this.noWarehouseMessage = this.dialog.getByText(/no warehouse|create.*warehouse first/i)
    this.platformList = this.dialog.locator('[class*="platformList"]')

    // Step 2: Visualizations
    this.addKPIButton = this.dialog.getByRole('button', { name: /add kpi|kpi card/i })
    this.addBarChartButton = this.dialog.getByRole('button', { name: /bar chart/i })
    this.addLineChartButton = this.dialog.getByRole('button', { name: /line chart/i })
    this.addPieChartButton = this.dialog.getByRole('button', { name: /pie chart/i })
    this.visualizationList = this.dialog.locator('[class*="visualizationList"], [class*="vizList"]')
    this.emptyStateMessage = this.dialog.getByText(/no visualizations|add.*visualization/i)

    // Visualization modal - appears on top of wizard dialog
    this.vizModal = page.locator('[class*="ChartConfigPanel"], [class*="vizModal"]').first()
    this.vizTitleInput = this.vizModal.getByLabel(/title|name/i)
    this.vizMetricSelect = this.vizModal.getByRole('combobox', { name: /metric/i })
    this.vizSaveButton = this.vizModal.getByRole('button', { name: /save|add|create/i })
    this.vizCancelButton = this.vizModal.getByRole('button', { name: /cancel/i })

    // Step 3: Schedule
    this.frequencyOnDemand = this.dialog.getByRole('radio', { name: /on.*demand/i })
    this.frequencyDaily = this.dialog.getByRole('radio', { name: /daily/i })
    this.frequencyWeekly = this.dialog.getByRole('radio', { name: /weekly/i })
    this.frequencyMonthly = this.dialog.getByRole('radio', { name: /monthly/i })
    this.recipientInput = this.dialog.getByPlaceholder(/email|recipient/i)
    this.addRecipientButton = this.dialog.getByRole('button', { name: /add.*recipient|add email/i })
    this.recipientList = this.dialog.locator('[class*="recipientList"]')
    this.deliveryFormatSelect = this.dialog.getByRole('combobox', { name: /format/i })
    this.timeInput = this.dialog.getByLabel(/time/i)
    this.daySelect = this.dialog.getByRole('combobox', { name: /day/i })

    // Step 4: Review
    this.reportNameInput = this.dialog.getByLabel(/report name|name/i)
    this.reportSummary = this.dialog.locator('[class*="summary"]')
    this.previewSection = this.dialog.locator('[class*="preview"]')
  }

  // ==================== Visibility Helpers ====================

  /**
   * Check if the report builder dialog is visible
   */
  async isVisible(): Promise<boolean> {
    return this.dialog.isVisible()
  }

  /**
   * Wait for the wizard to appear
   */
  async waitForWizard(): Promise<void> {
    await expect(this.dialog).toBeVisible({ timeout: 10000 })
    await expect(this.title).toBeVisible({ timeout: 5000 })
  }

  /**
   * Wait for the wizard to close
   */
  async waitForWizardToClose(): Promise<void> {
    await expect(this.dialog).not.toBeVisible({ timeout: 5000 })
  }

  // ==================== Navigation ====================

  /**
   * Click Next to proceed to the next step
   */
  async clickNext(): Promise<void> {
    await this.nextButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Click Back to go to the previous step
   */
  async clickBack(): Promise<void> {
    await this.backButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Cancel the wizard
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click()
    await this.waitForWizardToClose()
  }

  /**
   * Complete the wizard (final step)
   */
  async complete(): Promise<void> {
    await this.completeButton.click()
    await this.waitForWizardToClose()
  }

  // ==================== Step 1: Data Source ====================

  /**
   * Select a warehouse from the dropdown
   */
  async selectWarehouse(warehouseName: string): Promise<void> {
    await this.warehouseSelect.click()
    await this.page.getByRole('option', { name: new RegExp(warehouseName, 'i') }).click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Select a date range
   */
  async selectDateRange(range: string): Promise<void> {
    await this.dateRangeSelect.click()
    await this.page.getByRole('option', { name: new RegExp(range, 'i') }).click()
  }

  /**
   * Assert we're on the data source step
   */
  async expectDataSourceStep(): Promise<void> {
    await expect(this.dialog.getByRole('heading', { name: /data source/i })).toBeVisible()
  }

  /**
   * Assert no warehouse message is visible
   */
  async expectNoWarehouseMessage(): Promise<void> {
    await expect(this.noWarehouseMessage).toBeVisible()
  }

  // ==================== Step 2: Visualizations ====================

  /**
   * Click add KPI button
   */
  async openAddKPI(): Promise<void> {
    await this.addKPIButton.click()
    await expect(this.vizModal).toBeVisible({ timeout: 5000 })
  }

  /**
   * Click add bar chart button
   */
  async openAddBarChart(): Promise<void> {
    await this.addBarChartButton.click()
    await expect(this.vizModal).toBeVisible({ timeout: 5000 })
  }

  /**
   * Click add line chart button
   */
  async openAddLineChart(): Promise<void> {
    await this.addLineChartButton.click()
    await expect(this.vizModal).toBeVisible({ timeout: 5000 })
  }

  /**
   * Click add pie chart button
   */
  async openAddPieChart(): Promise<void> {
    await this.addPieChartButton.click()
    await expect(this.vizModal).toBeVisible({ timeout: 5000 })
  }

  /**
   * Add a KPI card visualization
   */
  async addKPI(config: { title: string; metric?: string }): Promise<void> {
    await this.openAddKPI()
    await this.vizTitleInput.fill(config.title)
    if (config.metric) {
      await this.vizMetricSelect.click()
      await this.page.getByRole('option', { name: new RegExp(config.metric, 'i') }).click()
    }
    await this.vizSaveButton.click()
    await expect(this.vizModal).not.toBeVisible({ timeout: 5000 })
  }

  /**
   * Add a bar chart visualization
   */
  async addBarChart(config: { title: string; metric?: string }): Promise<void> {
    await this.openAddBarChart()
    await this.vizTitleInput.fill(config.title)
    if (config.metric) {
      await this.vizMetricSelect.click()
      await this.page.getByRole('option', { name: new RegExp(config.metric, 'i') }).click()
    }
    await this.vizSaveButton.click()
    await expect(this.vizModal).not.toBeVisible({ timeout: 5000 })
  }

  /**
   * Cancel the visualization modal
   */
  async cancelVizModal(): Promise<void> {
    await this.vizCancelButton.click()
    await expect(this.vizModal).not.toBeVisible({ timeout: 5000 })
  }

  /**
   * Get the count of visualizations
   */
  async getVisualizationCount(): Promise<number> {
    const items = this.visualizationList.locator('[class*="item"], [class*="card"]')
    return items.count()
  }

  /**
   * Remove a visualization by index
   */
  async removeVisualization(index: number): Promise<void> {
    const removeButton = this.visualizationList
      .locator('[class*="item"], [class*="card"]')
      .nth(index)
      .getByRole('button', { name: /remove|delete/i })
    await removeButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Assert we're on the visualizations step
   */
  async expectVisualizationsStep(): Promise<void> {
    await expect(this.dialog.getByRole('heading', { name: /visualizations/i })).toBeVisible()
  }

  /**
   * Assert empty state is shown
   */
  async expectEmptyState(): Promise<void> {
    await expect(this.emptyStateMessage).toBeVisible()
  }

  // ==================== Step 3: Schedule ====================

  /**
   * Select frequency
   */
  async selectFrequency(frequency: 'on_demand' | 'daily' | 'weekly' | 'monthly'): Promise<void> {
    switch (frequency) {
      case 'on_demand':
        await this.frequencyOnDemand.click()
        break
      case 'daily':
        await this.frequencyDaily.click()
        break
      case 'weekly':
        await this.frequencyWeekly.click()
        break
      case 'monthly':
        await this.frequencyMonthly.click()
        break
    }
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Add a recipient email
   */
  async addRecipient(email: string): Promise<void> {
    await this.recipientInput.fill(email)
    await this.addRecipientButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Add multiple recipients
   */
  async addRecipients(emails: string[]): Promise<void> {
    for (const email of emails) {
      await this.addRecipient(email)
    }
  }

  /**
   * Get the count of recipients
   */
  async getRecipientCount(): Promise<number> {
    const items = this.recipientList.locator('[class*="recipient"]')
    return items.count()
  }

  /**
   * Remove a recipient by index
   */
  async removeRecipient(index: number): Promise<void> {
    const removeButton = this.recipientList
      .locator('[class*="recipient"]')
      .nth(index)
      .getByRole('button', { name: /remove|delete/i })
    await removeButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Select delivery format
   */
  async selectDeliveryFormat(format: string): Promise<void> {
    await this.deliveryFormatSelect.click()
    await this.page.getByRole('option', { name: new RegExp(format, 'i') }).click()
  }

  /**
   * Set delivery time
   */
  async setDeliveryTime(time: string): Promise<void> {
    await this.timeInput.fill(time)
  }

  /**
   * Select day of week (for weekly frequency)
   */
  async selectDayOfWeek(day: string): Promise<void> {
    await this.daySelect.click()
    await this.page.getByRole('option', { name: new RegExp(day, 'i') }).click()
  }

  /**
   * Assert we're on the schedule step
   */
  async expectScheduleStep(): Promise<void> {
    await expect(this.dialog.getByRole('heading', { name: /schedule/i })).toBeVisible()
  }

  // ==================== Step 4: Review ====================

  /**
   * Set the report name
   */
  async setReportName(name: string): Promise<void> {
    await this.reportNameInput.clear()
    await this.reportNameInput.fill(name)
  }

  /**
   * Get the report name from the input
   */
  async getReportName(): Promise<string> {
    return (await this.reportNameInput.inputValue()) || ''
  }

  /**
   * Assert we're on the review step
   */
  async expectReviewStep(): Promise<void> {
    await expect(this.dialog.getByRole('heading', { name: /review/i })).toBeVisible()
  }

  // ==================== Full Flow Helpers ====================

  /**
   * Complete a quick on-demand report
   */
  async completeQuickFlow(config: {
    warehouseName: string
    reportName: string
    kpiTitle?: string
  }): Promise<void> {
    const { warehouseName, reportName, kpiTitle = 'Total Spend' } = config

    // Step 1: Select warehouse
    await this.selectWarehouse(warehouseName)
    await this.clickNext()

    // Step 2: Add a KPI
    await this.addKPI({ title: kpiTitle })
    await this.clickNext()

    // Step 3: Use on-demand (default)
    await this.selectFrequency('on_demand')
    await this.clickNext()

    // Step 4: Name and complete
    await this.setReportName(reportName)
    await this.complete()
  }

  /**
   * Complete a scheduled report
   */
  async completeScheduledFlow(config: {
    warehouseName: string
    reportName: string
    kpiTitle?: string
    frequency: 'daily' | 'weekly' | 'monthly'
    recipients: string[]
  }): Promise<void> {
    const { warehouseName, reportName, kpiTitle = 'Total Spend', frequency, recipients } = config

    // Step 1: Select warehouse
    await this.selectWarehouse(warehouseName)
    await this.clickNext()

    // Step 2: Add a KPI
    await this.addKPI({ title: kpiTitle })
    await this.clickNext()

    // Step 3: Configure schedule
    await this.selectFrequency(frequency)
    await this.addRecipients(recipients)
    await this.clickNext()

    // Step 4: Name and complete
    await this.setReportName(reportName)
    await this.complete()
  }

  // ==================== Assertions ====================

  /**
   * Assert Next button is enabled
   */
  async expectNextEnabled(): Promise<void> {
    await expect(this.nextButton).toBeEnabled()
  }

  /**
   * Assert Next button is disabled
   */
  async expectNextDisabled(): Promise<void> {
    await expect(this.nextButton).toBeDisabled()
  }

  /**
   * Assert Back button is visible
   */
  async expectBackButtonVisible(): Promise<void> {
    await expect(this.backButton).toBeVisible()
  }

  /**
   * Assert Back button is not visible (first step)
   */
  async expectBackButtonNotVisible(): Promise<void> {
    await expect(this.backButton).not.toBeVisible()
  }

  /**
   * Assert Cancel button is visible
   */
  async expectCancelButtonVisible(): Promise<void> {
    await expect(this.cancelButton).toBeVisible()
  }

  /**
   * Assert an error message is shown
   */
  async expectError(message?: string | RegExp): Promise<void> {
    const errorLocator = this.dialog.getByRole('alert')
    await expect(errorLocator).toBeVisible()
    if (message) {
      await expect(errorLocator).toHaveText(message)
    }
  }

  /**
   * Assert email validation error is shown
   */
  async expectEmailError(): Promise<void> {
    await expect(
      this.dialog.getByText(/invalid email|valid email|please enter a valid/i)
    ).toBeVisible()
  }
}

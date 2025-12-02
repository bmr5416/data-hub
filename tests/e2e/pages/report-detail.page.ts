/**
 * Report Detail Page Object
 *
 * Represents the Report Detail Modal with tabs:
 * - Overview: Report stats summary
 * - Visualizations: KPIs and charts
 * - Schedule: Frequency settings
 * - Delivery: Send report functionality
 * - Alerts: Alert configuration
 */

import { Page, Locator, expect } from '@playwright/test'

export class ReportDetailPage {
  readonly page: Page

  // Modal container
  readonly modal: Locator
  readonly closeButton: Locator

  // Header actions
  readonly editButton: Locator
  readonly deleteButton: Locator
  readonly confirmDeleteButton: Locator
  readonly nameInput: Locator
  readonly saveButton: Locator
  readonly cancelEditButton: Locator

  // Tabs
  readonly overviewTab: Locator
  readonly visualizationsTab: Locator
  readonly scheduleTab: Locator
  readonly deliveryTab: Locator
  readonly alertsTab: Locator

  // Overview tab
  readonly visualizationCount: Locator
  readonly frequencyDisplay: Locator
  readonly formatDisplay: Locator
  readonly recipientCount: Locator
  readonly lastSentDisplay: Locator
  readonly nextScheduledDisplay: Locator

  // Visualizations tab
  readonly vizGrid: Locator
  readonly addKPIButton: Locator
  readonly addBarChartButton: Locator
  readonly addLineChartButton: Locator
  readonly addPieChartButton: Locator
  readonly vizEmptyState: Locator

  // Visualization modal
  readonly vizModal: Locator
  readonly vizTitleInput: Locator
  readonly vizFormatSelect: Locator
  readonly vizSaveButton: Locator
  readonly vizCancelButton: Locator

  // Schedule tab
  readonly frequencyDisplay2: Locator
  readonly dayDisplay: Locator
  readonly timeDisplay: Locator
  readonly timezoneDisplay: Locator

  // Delivery tab
  readonly testEmailInput: Locator
  readonly sendTestButton: Locator
  readonly sendNowButton: Locator
  readonly sendResult: Locator
  readonly recipientsList: Locator

  // Alerts tab
  readonly addAlertButton: Locator
  readonly alertForm: Locator
  readonly alertTypeSelect: Locator
  readonly alertMetricInput: Locator
  readonly alertConditionSelect: Locator
  readonly alertThresholdInput: Locator
  readonly createAlertButton: Locator
  readonly alertsList: Locator
  readonly alertEmptyState: Locator

  // Loading overlay
  readonly loadingOverlay: Locator

  constructor(page: Page) {
    this.page = page

    // Main modal container
    this.modal = page.getByRole('dialog')
    this.closeButton = this.modal.locator('button').filter({ hasText: /close|×/i }).first()

    // Header actions
    this.editButton = this.modal.getByRole('button', { name: /edit/i })
    this.deleteButton = this.modal.getByRole('button', { name: /delete/i })
    this.confirmDeleteButton = this.modal.getByRole('button', { name: /confirm delete/i })
    this.nameInput = this.modal.locator('input[class*="nameInput"]')
    this.saveButton = this.modal.getByRole('button', { name: /^save$/i })
    this.cancelEditButton = this.modal.locator('[class*="headerActions"]').getByRole('button', { name: /cancel/i })

    // Tabs
    this.overviewTab = this.modal.getByRole('button', { name: /overview/i })
    this.visualizationsTab = this.modal.getByRole('button', { name: /visualizations/i })
    this.scheduleTab = this.modal.getByRole('button', { name: /schedule/i })
    this.deliveryTab = this.modal.getByRole('button', { name: /delivery/i })
    this.alertsTab = this.modal.getByRole('button', { name: /alerts/i })

    // Overview tab elements
    this.visualizationCount = this.modal.locator('[class*="statCard"]').filter({ hasText: /visualizations/i })
    this.frequencyDisplay = this.modal.locator('[class*="statCard"]').filter({ hasText: /frequency/i })
    this.formatDisplay = this.modal.locator('[class*="statCard"]').filter({ hasText: /format/i })
    this.recipientCount = this.modal.locator('[class*="statCard"]').filter({ hasText: /recipients/i })
    this.lastSentDisplay = this.modal.locator('[class*="infoRow"]').filter({ hasText: /last sent/i })
    this.nextScheduledDisplay = this.modal.locator('[class*="infoRow"]').filter({ hasText: /next scheduled/i })

    // Visualizations tab elements
    this.vizGrid = this.modal.locator('[class*="vizGrid"]')
    this.addKPIButton = this.modal.getByRole('button', { name: /add kpi/i })
    this.addBarChartButton = this.modal.getByRole('button', { name: /bar chart/i })
    this.addLineChartButton = this.modal.getByRole('button', { name: /line chart/i })
    this.addPieChartButton = this.modal.getByRole('button', { name: /pie chart/i })
    this.vizEmptyState = this.modal.getByText(/no visualizations configured/i)

    // Visualization modal (rendered via portal)
    this.vizModal = page.locator('[class*="vizModal"]')
    this.vizTitleInput = this.vizModal.locator('#viz-title')
    this.vizFormatSelect = this.vizModal.locator('#viz-format')
    this.vizSaveButton = this.vizModal.getByRole('button', { name: /add visualization|save changes/i })
    this.vizCancelButton = this.vizModal.getByRole('button', { name: /cancel/i })

    // Schedule tab elements
    this.frequencyDisplay2 = this.modal.locator('[class*="scheduleInfo"] [class*="infoRow"]').filter({ hasText: /frequency/i })
    this.dayDisplay = this.modal.locator('[class*="scheduleInfo"] [class*="infoRow"]').filter({ hasText: /day/i })
    this.timeDisplay = this.modal.locator('[class*="scheduleInfo"] [class*="infoRow"]').filter({ hasText: /time/i })
    this.timezoneDisplay = this.modal.locator('[class*="scheduleInfo"] [class*="infoRow"]').filter({ hasText: /timezone/i })

    // Delivery tab elements
    this.testEmailInput = this.modal.locator('input[type="email"]')
    this.sendTestButton = this.modal.getByRole('button', { name: /send test/i })
    this.sendNowButton = this.modal.getByRole('button', { name: /send now/i })
    this.sendResult = this.modal.locator('[class*="sendResult"]')
    this.recipientsList = this.modal.locator('[class*="recipientsList"]')

    // Alerts tab elements
    this.addAlertButton = this.modal.getByRole('button', { name: /add alert/i })
    this.alertForm = this.modal.locator('[class*="alertForm"]')
    this.alertTypeSelect = this.modal.locator('#alert-type')
    this.alertMetricInput = this.modal.locator('#alert-metric')
    this.alertConditionSelect = this.modal.locator('#alert-condition')
    this.alertThresholdInput = this.modal.locator('#alert-threshold')
    this.createAlertButton = this.modal.getByRole('button', { name: /create alert/i })
    this.alertsList = this.modal.locator('[class*="alertsList"]')
    this.alertEmptyState = this.modal.getByText(/no alerts configured/i)

    // Loading
    this.loadingOverlay = this.modal.locator('[class*="loadingOverlay"]')
  }

  // ===== Modal lifecycle =====

  async waitForModal() {
    await expect(this.modal).toBeVisible({ timeout: 10000 })
  }

  async close() {
    await this.closeButton.click()
    await expect(this.modal).not.toBeVisible({ timeout: 5000 })
  }

  // ===== Tab navigation =====

  async clickTab(tabName: 'overview' | 'visualizations' | 'schedule' | 'delivery' | 'alerts') {
    const tabMap = {
      overview: this.overviewTab,
      visualizations: this.visualizationsTab,
      schedule: this.scheduleTab,
      delivery: this.deliveryTab,
      alerts: this.alertsTab,
    }
    await tabMap[tabName].click()
  }

  async expectTab(tabName: 'overview' | 'visualizations' | 'schedule' | 'delivery' | 'alerts') {
    const tabMap = {
      overview: this.overviewTab,
      visualizations: this.visualizationsTab,
      schedule: this.scheduleTab,
      delivery: this.deliveryTab,
      alerts: this.alertsTab,
    }
    await expect(tabMap[tabName]).toHaveClass(/activeTab/)
  }

  // ===== Header actions =====

  async startEdit() {
    await this.editButton.click()
    await expect(this.nameInput).toBeVisible()
  }

  async setReportName(name: string) {
    await this.nameInput.clear()
    await this.nameInput.fill(name)
  }

  async saveEdit() {
    await this.saveButton.click()
  }

  async cancelEdit() {
    await this.cancelEditButton.click()
  }

  async deleteReport() {
    await this.deleteButton.click()
    await expect(this.confirmDeleteButton).toBeVisible()
    await this.confirmDeleteButton.click()
  }

  // ===== Overview tab =====

  async getVisualizationCount(): Promise<number> {
    const text = await this.visualizationCount.locator('[class*="statValue"]').textContent()
    return parseInt(text || '0', 10)
  }

  async getFrequency(): Promise<string> {
    const text = await this.frequencyDisplay.locator('[class*="statValue"]').textContent()
    return text || ''
  }

  async getRecipientCount(): Promise<number> {
    const text = await this.recipientCount.locator('[class*="statValue"]').textContent()
    return parseInt(text || '0', 10)
  }

  // ===== Delivery tab =====

  async goToDeliveryTab() {
    await this.clickTab('delivery')
    await expect(this.testEmailInput).toBeVisible()
  }

  async sendTestEmail(email: string) {
    await this.testEmailInput.clear()
    await this.testEmailInput.fill(email)
    await this.sendTestButton.click()
  }

  async expectSendSuccess() {
    await expect(this.sendResult).toBeVisible({ timeout: 10000 })
    await expect(this.sendResult).toHaveClass(/success/)
  }

  async expectSendError() {
    await expect(this.sendResult).toBeVisible({ timeout: 10000 })
    await expect(this.sendResult).toHaveClass(/error/)
  }

  async sendNow() {
    await this.sendNowButton.click()
  }

  // ===== Visualizations tab =====

  async goToVisualizationsTab() {
    await this.clickTab('visualizations')
  }

  async addKPI(config: { title: string; format?: string }) {
    await this.addKPIButton.click()
    await expect(this.vizModal).toBeVisible()
    await this.vizTitleInput.fill(config.title)
    if (config.format) {
      await this.vizFormatSelect.selectOption(config.format)
    }
    await this.vizSaveButton.click()
    await expect(this.vizModal).not.toBeVisible()
  }

  async addBarChart(config: { title: string }) {
    await this.addBarChartButton.click()
    await expect(this.vizModal).toBeVisible()
    await this.vizTitleInput.fill(config.title)
    await this.vizSaveButton.click()
    await expect(this.vizModal).not.toBeVisible()
  }

  async editVisualization(index: number) {
    const vizItem = this.vizGrid.locator('[class*="vizItem"]').nth(index)
    await vizItem.getByRole('button', { name: /edit/i }).click()
    await expect(this.vizModal).toBeVisible()
  }

  async removeVisualization(index: number) {
    const vizItem = this.vizGrid.locator('[class*="vizItem"]').nth(index)
    await vizItem.getByRole('button', { name: /delete/i }).click()
  }

  async cancelVizModal() {
    await this.vizCancelButton.click()
    await expect(this.vizModal).not.toBeVisible()
  }

  // ===== Alerts tab =====

  async goToAlertsTab() {
    await this.clickTab('alerts')
    // Wait for alerts to load
    await this.page.waitForTimeout(500)
  }

  async openAddAlert() {
    await this.addAlertButton.click()
    await expect(this.alertForm).toBeVisible()
  }

  async createThresholdAlert(config: { metric: string; condition?: string; threshold: number }) {
    await this.openAddAlert()
    await this.alertTypeSelect.selectOption('metric_threshold')
    await this.alertMetricInput.fill(config.metric)
    if (config.condition) {
      await this.alertConditionSelect.selectOption(config.condition)
    }
    await this.alertThresholdInput.fill(config.threshold.toString())
    await this.createAlertButton.click()
    await expect(this.alertForm).not.toBeVisible()
  }

  async getAlertCount(): Promise<number> {
    return await this.alertsList.locator('[class*="alertItem"]').count()
  }

  async toggleAlert(index: number) {
    const alertItem = this.alertsList.locator('[class*="alertItem"]').nth(index)
    await alertItem.getByRole('button', { name: /enable|disable/i }).click()
  }

  async deleteAlert(index: number) {
    const alertItem = this.alertsList.locator('[class*="alertItem"]').nth(index)
    await alertItem.getByRole('button').filter({ has: this.page.locator('[name="trash"]') }).click()
  }

  // ===== Schedule tab =====

  async goToScheduleTab() {
    await this.clickTab('schedule')
  }

  async expectScheduleInfo() {
    await expect(this.modal.locator('[class*="scheduleCard"]')).toBeVisible()
  }
}

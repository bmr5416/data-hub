/**
 * Warehouse Wizard Page Object
 *
 * Represents the 3-step warehouse creation wizard:
 * 1. Select Sources
 * 2. Select Fields
 * 3. Review & Create
 */

import { Page, Locator, expect } from '@playwright/test'

export class WarehouseWizardPage {
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

  // Step 1: Source Selection
  readonly sourceList: Locator
  readonly noSourcesMessage: Locator
  readonly selectedCount: Locator
  readonly searchInput: Locator

  // Step 2: Field Selection
  readonly platformTabs: Locator
  readonly useRecommendedButton: Locator
  readonly customModeButton: Locator
  readonly fieldSelector: Locator
  readonly dimensionsList: Locator
  readonly metricsList: Locator

  // Step 3: Review & Create
  readonly warehouseNameInput: Locator
  readonly blendedTableCheckbox: Locator
  readonly platformSummary: Locator
  readonly fieldSummary: Locator

  constructor(page: Page) {
    this.page = page

    // Main dialog container - all locators scoped to this
    this.dialog = page.getByRole('dialog')

    // Wizard header
    this.title = this.dialog.getByRole('heading', { name: /create.*warehouse|data warehouse/i })
    this.subtitle = this.dialog.getByText(/set up a new data warehouse/i)

    // Progress bar
    this.progressBar = this.dialog.locator('[class*="WizardProgress"]')

    // Navigation buttons
    this.nextButton = this.dialog.getByRole('button', { name: /next/i })
    this.backButton = this.dialog.getByRole('button', { name: /back/i })
    this.cancelButton = this.dialog.getByRole('button', { name: /cancel/i })
    this.completeButton = this.dialog.getByRole('button', { name: 'Complete', exact: true })

    // Step 1: Source Selection
    this.sourceList = this.dialog.locator('[class*="SourceSelection"], [class*="platformList"]')
    this.noSourcesMessage = this.dialog.getByText(/no.*sources|add.*sources first/i)
    this.selectedCount = this.dialog.getByText(/selected/i)
    this.searchInput = this.dialog.getByPlaceholder(/search/i)

    // Step 2: Field Selection
    this.platformTabs = this.dialog.locator('[role="tablist"]')
    this.useRecommendedButton = this.dialog.getByRole('button', { name: /recommended|use recommended/i })
    this.customModeButton = this.dialog.getByRole('button', { name: /custom|customize/i })
    this.fieldSelector = this.dialog.locator('[class*="FieldSelector"]')
    this.dimensionsList = this.dialog.locator('[class*="dimensions"]')
    this.metricsList = this.dialog.locator('[class*="metrics"]')

    // Step 3: Review & Create
    this.warehouseNameInput = this.dialog.getByLabel(/warehouse name|name/i)
    this.blendedTableCheckbox = this.dialog.getByRole('checkbox', { name: /blended|include blended/i })
    this.platformSummary = this.dialog.locator('[class*="platformSummary"]')
    this.fieldSummary = this.dialog.locator('[class*="fieldSummary"]')
  }

  // ==================== Visibility Helpers ====================

  /**
   * Check if the warehouse wizard dialog is visible
   */
  async isVisible(): Promise<boolean> {
    return this.dialog.isVisible()
  }

  /**
   * Wait for the wizard to appear
   */
  async waitForWizard(): Promise<void> {
    await expect(this.dialog).toBeVisible({ timeout: 10000 })
    // Wait for title - could be standalone or embedded
    await expect(
      this.dialog.getByRole('heading', { name: /warehouse|select sources/i })
    ).toBeVisible({ timeout: 5000 })
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

  // ==================== Step 1: Source Selection ====================

  /**
   * Get a platform checkbox by name
   */
  getPlatformCheckbox(platform: string): Locator {
    return this.dialog.getByRole('checkbox', { name: new RegExp(platform, 'i') })
  }

  /**
   * Select a platform by name
   */
  async selectPlatform(platform: string): Promise<void> {
    const checkbox = this.getPlatformCheckbox(platform)
    await checkbox.check()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Deselect a platform by name
   */
  async deselectPlatform(platform: string): Promise<void> {
    const checkbox = this.getPlatformCheckbox(platform)
    await checkbox.uncheck()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Select multiple platforms
   */
  async selectPlatforms(platforms: string[]): Promise<void> {
    for (const platform of platforms) {
      await this.selectPlatform(platform)
    }
  }

  /**
   * Search for platforms
   */
  async searchPlatforms(query: string): Promise<void> {
    await this.searchInput.fill(query)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Assert we're on the source selection step
   */
  async expectSourceSelectionStep(): Promise<void> {
    await expect(this.dialog.getByRole('heading', { name: /select sources/i })).toBeVisible()
  }

  /**
   * Assert no sources message is visible
   */
  async expectNoSourcesMessage(): Promise<void> {
    await expect(this.noSourcesMessage).toBeVisible()
  }

  /**
   * Get the selected platform count
   */
  async getSelectedCount(): Promise<number> {
    const text = await this.selectedCount.textContent()
    const match = text?.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  // ==================== Step 2: Field Selection ====================

  /**
   * Click on a platform tab
   */
  async clickPlatformTab(platform: string): Promise<void> {
    await this.platformTabs.getByRole('tab', { name: new RegExp(platform, 'i') }).click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Use recommended fields for all platforms
   */
  async useRecommendedFields(): Promise<void> {
    await this.useRecommendedButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Switch to custom field mode
   */
  async useCustomMode(): Promise<void> {
    await this.customModeButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Toggle a dimension field
   */
  async toggleDimension(fieldName: string): Promise<void> {
    await this.dialog.getByRole('checkbox', { name: new RegExp(fieldName, 'i') }).click()
  }

  /**
   * Toggle a metric field
   */
  async toggleMetric(fieldName: string): Promise<void> {
    await this.dialog.getByRole('checkbox', { name: new RegExp(fieldName, 'i') }).click()
  }

  /**
   * Assert we're on the field selection step
   */
  async expectFieldSelectionStep(): Promise<void> {
    await expect(this.dialog.getByRole('heading', { name: /select fields/i })).toBeVisible()
  }

  // ==================== Step 3: Review & Create ====================

  /**
   * Set the warehouse name
   */
  async setWarehouseName(name: string): Promise<void> {
    await this.warehouseNameInput.clear()
    await this.warehouseNameInput.fill(name)
  }

  /**
   * Toggle the blended table checkbox
   */
  async toggleBlendedTable(): Promise<void> {
    await this.blendedTableCheckbox.click()
  }

  /**
   * Check the blended table option
   */
  async checkBlendedTable(): Promise<void> {
    await this.blendedTableCheckbox.check()
  }

  /**
   * Uncheck the blended table option
   */
  async uncheckBlendedTable(): Promise<void> {
    await this.blendedTableCheckbox.uncheck()
  }

  /**
   * Assert we're on the review step
   */
  async expectReviewStep(): Promise<void> {
    await expect(this.dialog.getByRole('heading', { name: /review|create/i })).toBeVisible()
  }

  /**
   * Get the warehouse name from the input
   */
  async getWarehouseName(): Promise<string> {
    return (await this.warehouseNameInput.inputValue()) || ''
  }

  // ==================== Full Flow Helpers ====================

  /**
   * Complete the wizard with a single platform using recommended fields
   * @param config - Wizard configuration
   */
  async completeQuickFlow(config: {
    platform: string
    name?: string
    includeBlended?: boolean
  }): Promise<void> {
    const { platform, name, includeBlended = true } = config

    // Step 1: Select platform
    await this.selectPlatform(platform)
    await this.clickNext()

    // Step 2: Use recommended fields
    await this.useRecommendedFields()
    await this.clickNext()

    // Step 3: Review and create
    if (name) {
      await this.setWarehouseName(name)
    }
    if (!includeBlended) {
      await this.uncheckBlendedTable()
    }
    await this.complete()
  }

  /**
   * Complete the wizard with multiple platforms
   * @param config - Wizard configuration
   */
  async completeFullFlow(config: {
    platforms: string[]
    name?: string
    includeBlended?: boolean
  }): Promise<void> {
    const { platforms, name, includeBlended = true } = config

    // Step 1: Select platforms
    await this.selectPlatforms(platforms)
    await this.clickNext()

    // Step 2: Use recommended fields
    await this.useRecommendedFields()
    await this.clickNext()

    // Step 3: Review and create
    if (name) {
      await this.setWarehouseName(name)
    }
    if (!includeBlended) {
      await this.uncheckBlendedTable()
    }
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
   * Assert platform is selected
   */
  async expectPlatformSelected(platform: string): Promise<void> {
    await expect(this.getPlatformCheckbox(platform)).toBeChecked()
  }

  /**
   * Assert platform is not selected
   */
  async expectPlatformNotSelected(platform: string): Promise<void> {
    await expect(this.getPlatformCheckbox(platform)).not.toBeChecked()
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
}

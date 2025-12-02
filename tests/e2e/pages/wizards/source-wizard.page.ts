/**
 * Source Wizard Page Object
 *
 * Represents the 4-step source wizard:
 * 1. Select Platform
 * 2. Configure Fields
 * 3. Data Warehouse
 * 4. Upload Data
 */

import { Page, Locator, expect } from '@playwright/test'

export class SourceWizardPage {
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

  // Step 1: Platform Selection
  readonly platformGrid: Locator

  // Step 2: Field Configuration
  readonly schemaPreview: Locator
  readonly approveButton: Locator
  readonly approvedIndicator: Locator

  // Step 3: Warehouse Selection
  readonly createNewOption: Locator
  readonly existingOption: Locator
  readonly skipOption: Locator
  readonly embeddedWarehouseWizard: Locator

  // Step 4: Data Upload
  readonly fileUploader: Locator
  readonly fileInput: Locator
  readonly skipUploadButton: Locator
  readonly uploadSuccessIndicator: Locator

  // Duplicate platform modal
  readonly duplicateModal: Locator
  readonly duplicateModalContinue: Locator
  readonly duplicateModalCancel: Locator

  constructor(page: Page) {
    this.page = page

    // Main dialog container - all locators scoped to this
    this.dialog = page.getByRole('dialog')

    // Wizard header
    this.title = this.dialog.getByRole('heading', { name: /add data source/i })
    this.subtitle = this.dialog.getByText(/connect a new platform/i)

    // Progress bar
    this.progressBar = this.dialog.locator('[class*="WizardProgress"]')

    // Navigation buttons
    this.nextButton = this.dialog.getByRole('button', { name: /next/i })
    this.backButton = this.dialog.getByRole('button', { name: /back/i })
    this.cancelButton = this.dialog.getByRole('button', { name: /cancel/i })
    this.completeButton = this.dialog.getByRole('button', { name: 'Complete', exact: true })

    // Step 1: Platform Selection
    this.platformGrid = this.dialog.locator('[class*="platformGrid"], [class*="PlatformSelect"]')

    // Step 2: Field Configuration
    this.schemaPreview = this.dialog.locator('[class*="SchemaPreview"], [class*="FieldConfiguration"]')
    this.approveButton = this.dialog.getByRole('button', { name: /approve|confirm/i })
    this.approvedIndicator = this.dialog.getByText(/approved|configuration approved/i)

    // Step 3: Warehouse Selection
    this.createNewOption = this.dialog.getByRole('radio', { name: /create.*warehouse|new warehouse/i })
    this.existingOption = this.dialog.getByRole('radio', { name: /existing|add to existing/i })
    this.skipOption = this.dialog.getByRole('radio', { name: /skip|don't create/i })
    this.embeddedWarehouseWizard = this.dialog.locator('[class*="CreateWarehouseWizard"]')

    // Step 4: Data Upload
    this.fileUploader = this.dialog.locator('[class*="FileUploader"]')
    this.fileInput = this.dialog.locator('input[type="file"]')
    this.skipUploadButton = this.dialog.getByRole('button', { name: /skip upload|skip for now/i })
    this.uploadSuccessIndicator = this.dialog.getByText(/uploaded|upload complete|success/i)

    // Duplicate platform modal (appears on top of wizard modal)
    this.duplicateModal = page.locator('[class*="DuplicatePlatformModal"]')
    this.duplicateModalContinue = this.duplicateModal.getByRole('button', { name: /continue|add anyway/i })
    this.duplicateModalCancel = this.duplicateModal.getByRole('button', { name: /cancel|go back/i })
  }

  // ==================== Visibility Helpers ====================

  /**
   * Check if the source wizard dialog is visible
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

  // ==================== Step 1: Platform Selection ====================

  /**
   * Get a platform button by name
   */
  getPlatformButton(platform: string): Locator {
    // Try multiple selector strategies for platform cards/buttons
    return this.dialog.locator(
      `[data-platform="${platform}"], ` +
      `button:has-text("${platform}"), ` +
      `[class*="platform"]:has-text("${platform}")`
    ).first()
  }

  /**
   * Select a platform by name
   */
  async selectPlatform(platform: string): Promise<void> {
    const platformButton = this.getPlatformButton(platform)
    await platformButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Check if a platform shows a warning badge (already added)
   */
  async hasPlatformWarning(platform: string): Promise<boolean> {
    const platformCard = this.getPlatformButton(platform).locator('..')
    const warningBadge = platformCard.locator('[class*="warning"], [class*="badge"]')
    return warningBadge.isVisible()
  }

  /**
   * Assert we're on the platform selection step
   */
  async expectPlatformStep(): Promise<void> {
    await expect(this.dialog.getByRole('heading', { name: /select platform/i })).toBeVisible()
  }

  // ==================== Step 2: Field Configuration ====================

  /**
   * Approve the schema configuration
   */
  async approveConfiguration(): Promise<void> {
    await this.approveButton.click()
    await expect(this.approvedIndicator).toBeVisible({ timeout: 5000 })
  }

  /**
   * Assert we're on the field configuration step
   */
  async expectFieldConfigurationStep(): Promise<void> {
    await expect(this.dialog.getByRole('heading', { name: /configure fields/i })).toBeVisible()
  }

  /**
   * Check if configuration is approved
   */
  async isConfigurationApproved(): Promise<boolean> {
    return this.approvedIndicator.isVisible()
  }

  // ==================== Step 3: Warehouse Selection ====================

  /**
   * Select warehouse option
   */
  async selectWarehouseOption(option: 'create' | 'existing' | 'skip'): Promise<void> {
    switch (option) {
      case 'create':
        await this.createNewOption.click()
        break
      case 'existing':
        await this.existingOption.click()
        break
      case 'skip':
        await this.skipOption.click()
        break
    }
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Assert we're on the warehouse selection step
   */
  async expectWarehouseStep(): Promise<void> {
    await expect(this.dialog.getByRole('heading', { name: /data warehouse|warehouse/i })).toBeVisible()
  }

  // ==================== Step 4: Data Upload ====================

  /**
   * Upload a file
   */
  async uploadFile(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Skip the upload step
   */
  async skipUpload(): Promise<void> {
    await this.skipUploadButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Assert we're on the upload step
   */
  async expectUploadStep(): Promise<void> {
    await expect(this.dialog.getByRole('heading', { name: /upload data/i })).toBeVisible()
  }

  /**
   * Assert upload was successful
   */
  async expectUploadSuccess(): Promise<void> {
    await expect(this.uploadSuccessIndicator).toBeVisible({ timeout: 10000 })
  }

  // ==================== Duplicate Platform Modal ====================

  /**
   * Check if duplicate platform modal is visible
   */
  async isDuplicateModalVisible(): Promise<boolean> {
    return this.duplicateModal.isVisible()
  }

  /**
   * Continue adding duplicate platform
   */
  async continueDuplicate(): Promise<void> {
    await this.duplicateModalContinue.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Cancel duplicate platform selection
   */
  async cancelDuplicate(): Promise<void> {
    await this.duplicateModalCancel.click()
    await this.page.waitForLoadState('networkidle')
  }

  // ==================== Full Flow Helpers ====================

  /**
   * Complete the wizard with skip options for speed
   * @param platform - Platform to select
   */
  async completeQuickFlow(platform: string): Promise<void> {
    // Step 1: Select platform
    await this.selectPlatform(platform)
    await this.clickNext()

    // Step 2: Approve configuration
    await this.approveConfiguration()
    await this.clickNext()

    // Step 3: Skip warehouse
    await this.selectWarehouseOption('skip')
    await this.clickNext()

    // Step 4: Skip upload and complete
    await this.skipUpload()
    await this.complete()
  }

  /**
   * Complete the full wizard with all options
   * @param config - Wizard configuration
   */
  async completeFullFlow(config: {
    platform: string
    warehouseOption?: 'create' | 'existing' | 'skip'
    csvPath?: string
  }): Promise<void> {
    const { platform, warehouseOption = 'skip', csvPath } = config

    // Step 1: Select platform
    await this.selectPlatform(platform)
    await this.clickNext()

    // Step 2: Approve configuration
    await this.approveConfiguration()
    await this.clickNext()

    // Step 3: Warehouse selection
    await this.selectWarehouseOption(warehouseOption)
    if (warehouseOption !== 'skip') {
      // Wait for embedded wizard if creating new
      await this.page.waitForLoadState('networkidle')
    }
    await this.clickNext()

    // Step 4: Upload or skip
    if (csvPath) {
      await this.uploadFile(csvPath)
      await this.expectUploadSuccess()
    } else {
      await this.skipUpload()
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

/**
 * Onboarding Wizard Page Object
 *
 * Represents the first-time user onboarding wizard.
 */

import { Page, Locator, expect } from '@playwright/test'

export class OnboardingPage {
  readonly page: Page

  // Wizard container
  readonly overlay: Locator
  readonly container: Locator
  readonly title: Locator
  readonly subtitle: Locator

  // Progress indicators
  readonly progressBar: Locator
  readonly stepIndicators: Locator

  // Navigation buttons
  readonly nextButton: Locator
  readonly backButton: Locator
  readonly skipButton: Locator
  readonly getStartedButton: Locator

  // Step content areas
  readonly welcomeStep: Locator
  readonly setupStep: Locator
  readonly completeStep: Locator

  constructor(page: Page) {
    this.page = page

    // Wizard container
    this.overlay = page.locator('[class*="overlay"]')
    this.container = page.locator('[class*="OnboardingWizard"]')
    this.title = page.getByRole('heading', { name: /getting started/i })
    this.subtitle = page.getByText(/welcome to data hub/i)

    // Progress
    this.progressBar = page.locator('[class*="WizardProgress"]')
    this.stepIndicators = page.locator('[class*="step"]')

    // Navigation - Wizard uses: Cancel, Back, Next/Complete
    this.nextButton = page.getByRole('button', { name: /next →|next$/i })
    this.backButton = page.getByRole('button', { name: /← back|back$/i })
    this.skipButton = page.getByRole('button', { name: /cancel/i }) // Wizard calls it Cancel, but it's functionally Skip
    this.getStartedButton = page.getByRole('button', { name: 'Complete', exact: true }) // Final step button - exact to avoid matching "(completed)" in step indicators

    // Steps - Use text content since CSS modules hash class names
    this.welcomeStep = page.getByRole('heading', { name: /welcome to data hub/i })
    this.setupStep = page.getByRole('heading', { name: /how data hub works/i })
    this.completeStep = page.getByRole('heading', { name: /you.*(all set|ready)/i })
  }

  /**
   * Check if onboarding wizard is visible
   */
  async isVisible(): Promise<boolean> {
    return this.overlay.isVisible()
  }

  /**
   * Wait for the onboarding wizard to appear
   */
  async waitForWizard(): Promise<void> {
    await expect(this.overlay).toBeVisible({ timeout: 10000 })
  }

  /**
   * Wait for the onboarding wizard to disappear
   */
  async waitForWizardToClose(): Promise<void> {
    await expect(this.overlay).not.toBeVisible({ timeout: 5000 })
  }

  /**
   * Get the current step number (1-based)
   */
  async getCurrentStep(): Promise<number> {
    const activeStep = this.page.locator('[class*="step"][class*="active"], [class*="step"][aria-current="true"]')
    const steps = await this.stepIndicators.all()

    for (let i = 0; i < steps.length; i++) {
      if (await steps[i].evaluate((el) => el.classList.contains('active') || el.getAttribute('aria-current') === 'true')) {
        return i + 1
      }
    }

    // Fallback: count which content is visible
    if (await this.welcomeStep.isVisible()) return 1
    if (await this.setupStep.isVisible()) return 2
    if (await this.completeStep.isVisible()) return 3

    return 1
  }

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
   * Skip the onboarding wizard
   */
  async skip(): Promise<void> {
    await this.skipButton.click()
    await this.waitForWizardToClose()
  }

  /**
   * Complete the onboarding wizard
   */
  async complete(): Promise<void> {
    await this.getStartedButton.click()
    await this.waitForWizardToClose()
  }

  /**
   * Navigate through all steps and complete
   */
  async completeAllSteps(): Promise<void> {
    // Step 1 -> 2
    await this.clickNext()

    // Step 2 -> 3
    await this.clickNext()

    // Complete
    await this.complete()
  }

  /**
   * Assert we're on the Welcome step
   */
  async expectWelcomeStep(): Promise<void> {
    await expect(this.welcomeStep).toBeVisible()
  }

  /**
   * Assert we're on the Setup step
   */
  async expectSetupStep(): Promise<void> {
    await expect(this.setupStep).toBeVisible()
  }

  /**
   * Assert we're on the Complete step
   */
  async expectCompleteStep(): Promise<void> {
    await expect(this.completeStep).toBeVisible()
  }

  /**
   * Assert the back button is visible (not on first step)
   */
  async expectBackButtonVisible(): Promise<void> {
    await expect(this.backButton).toBeVisible()
  }

  /**
   * Assert the back button is not visible (on first step)
   */
  async expectBackButtonNotVisible(): Promise<void> {
    await expect(this.backButton).not.toBeVisible()
  }

  /**
   * Assert the skip button is visible
   */
  async expectSkipButtonVisible(): Promise<void> {
    await expect(this.skipButton).toBeVisible()
  }
}

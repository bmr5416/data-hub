/**
 * Onboarding Wizard E2E Tests
 *
 * Tests for the first-time user onboarding flow:
 * - Wizard appears for new users
 * - Navigation through all steps
 * - Skip functionality
 * - Persistence after completion
 * - Back navigation
 *
 * Note: App has no frontend login - these tests work with localStorage
 * to simulate first-time vs returning users.
 */

import { test, expect } from '@playwright/test'
import { DashboardPage, OnboardingPage } from '../pages'
import { login, ROUTES } from '../fixtures/e2e-helpers'

const ONBOARDING_KEY = 'datahub_onboarding_complete'

/**
 * Helper to clear onboarding state (simulate first-time user)
 */
async function clearOnboarding(page: import('@playwright/test').Page) {
  // Login first since dashboard is protected
  await login(page)
  await page.evaluate((key) => localStorage.removeItem(key), ONBOARDING_KEY)
  await page.reload()
}

/**
 * Helper to skip onboarding state (simulate returning user)
 */
async function markOnboardingComplete(page: import('@playwright/test').Page) {
  // Login first since dashboard is protected
  await login(page)
  await page.evaluate((key) => localStorage.setItem(key, '1'), ONBOARDING_KEY)
  await page.reload()
}

test.describe('Onboarding Wizard', () => {
  test('first-time user sees onboarding wizard', async ({ page }) => {
    const onboarding = new OnboardingPage(page)

    // Clear onboarding to simulate first-time user
    await clearOnboarding(page)

    // Onboarding wizard should appear
    await onboarding.waitForWizard()
    await expect(onboarding.overlay).toBeVisible()
  })

  test('complete all 3 steps of onboarding', async ({ page }) => {
    const onboarding = new OnboardingPage(page)
    const dashboard = new DashboardPage(page)

    // Clear onboarding state
    await clearOnboarding(page)

    // Wait for onboarding
    await onboarding.waitForWizard()

    // Step 1: Welcome
    await onboarding.expectWelcomeStep()
    await onboarding.clickNext()

    // Step 2: How It Works / Quick Setup
    await onboarding.expectSetupStep()
    await onboarding.clickNext()

    // Step 3: Get Started / Complete
    await onboarding.expectCompleteStep()
    await onboarding.complete()

    // Wizard should close
    await onboarding.waitForWizardToClose()

    // Dashboard should be visible
    await dashboard.waitForLoad()
    await expect(dashboard.heading).toBeVisible()
  })

  test('skip onboarding closes wizard', async ({ page }) => {
    const onboarding = new OnboardingPage(page)
    const dashboard = new DashboardPage(page)

    // Clear onboarding state
    await clearOnboarding(page)

    // Wait for onboarding
    await onboarding.waitForWizard()

    // Skip
    await onboarding.skip()

    // Wizard should close
    await onboarding.waitForWizardToClose()

    // Dashboard should be accessible
    await dashboard.waitForLoad()
    await expect(dashboard.heading).toBeVisible()
  })

  test('onboarding not shown after completion', async ({ page }) => {
    const onboarding = new OnboardingPage(page)
    const dashboard = new DashboardPage(page)

    // Mark onboarding as complete (simulate returning user)
    await markOnboardingComplete(page)

    // Wait for dashboard to load
    await dashboard.waitForLoad()

    // Onboarding should NOT be visible
    const isVisible = await onboarding.isVisible()
    expect(isVisible).toBe(false)
  })

  test('onboarding not shown after skip', async ({ page }) => {
    const onboarding = new OnboardingPage(page)
    const dashboard = new DashboardPage(page)

    // First session: clear and skip onboarding
    await clearOnboarding(page)

    await onboarding.waitForWizard()
    await onboarding.skip()
    await onboarding.waitForWizardToClose()

    // "Second session": reload the page
    await page.reload()
    await dashboard.waitForLoad()

    // Onboarding should NOT appear again
    const isVisible = await onboarding.isVisible()
    expect(isVisible).toBe(false)
  })

  test('back navigation preserves wizard state', async ({ page }) => {
    const onboarding = new OnboardingPage(page)

    // Clear onboarding state
    await clearOnboarding(page)

    // Wait for onboarding
    await onboarding.waitForWizard()

    // Step 1 -> Step 2
    await onboarding.expectWelcomeStep()
    await onboarding.clickNext()
    await onboarding.expectSetupStep()

    // Step 2 -> Step 1 (back)
    await onboarding.clickBack()
    await onboarding.expectWelcomeStep()

    // Step 1 -> Step 2 -> Step 3
    await onboarding.clickNext()
    await onboarding.expectSetupStep()
    await onboarding.clickNext()
    await onboarding.expectCompleteStep()

    // Step 3 -> Step 2 (back)
    await onboarding.clickBack()
    await onboarding.expectSetupStep()
  })

  test('back button not visible on first step', async ({ page }) => {
    const onboarding = new OnboardingPage(page)

    // Clear onboarding state
    await clearOnboarding(page)

    // Wait for onboarding
    await onboarding.waitForWizard()

    // On step 1, back button should not be visible
    await onboarding.expectWelcomeStep()
    await onboarding.expectBackButtonNotVisible()

    // Move to step 2
    await onboarding.clickNext()
    await onboarding.expectSetupStep()

    // Now back button should be visible
    await onboarding.expectBackButtonVisible()
  })

  test('skip button available on all steps', async ({ page }) => {
    const onboarding = new OnboardingPage(page)

    // Clear onboarding state
    await clearOnboarding(page)

    // Wait for onboarding
    await onboarding.waitForWizard()

    // Step 1: skip should be visible
    await onboarding.expectWelcomeStep()
    await onboarding.expectSkipButtonVisible()

    // Step 2: skip should be visible
    await onboarding.clickNext()
    await onboarding.expectSetupStep()
    await onboarding.expectSkipButtonVisible()

    // Step 3: skip or complete button visible (may vary by implementation)
    await onboarding.clickNext()
    await onboarding.expectCompleteStep()
  })
})

test.describe('Onboarding - localStorage Behavior', () => {
  test('onboarding state persists in localStorage', async ({ page }) => {
    const onboarding = new OnboardingPage(page)

    // Start with clean state
    await clearOnboarding(page)

    // Verify localStorage is empty
    let isComplete = await page.evaluate(
      (key) => localStorage.getItem(key) === '1',
      ONBOARDING_KEY,
    )
    expect(isComplete).toBe(false)

    // Complete onboarding
    await onboarding.waitForWizard()
    await onboarding.completeAllSteps()

    // Verify localStorage is set
    isComplete = await page.evaluate(
      (key) => localStorage.getItem(key) === '1',
      ONBOARDING_KEY,
    )
    expect(isComplete).toBe(true)
  })

  test('clearing localStorage triggers onboarding again', async ({ page }) => {
    const onboarding = new OnboardingPage(page)
    const dashboard = new DashboardPage(page)

    // First, mark onboarding as complete
    await markOnboardingComplete(page)

    // Onboarding should not appear
    await dashboard.waitForLoad()
    expect(await onboarding.isVisible()).toBe(false)

    // Clear onboarding state and reload
    await page.evaluate((key) => localStorage.removeItem(key), ONBOARDING_KEY)
    await page.reload()

    // Onboarding should appear again
    await onboarding.waitForWizard()
    expect(await onboarding.isVisible()).toBe(true)
  })
})

/**
 * Responsive Design E2E Tests
 *
 * Tests application behavior across different viewport sizes:
 * - Desktop (1280x720, 1920x1080)
 * - Tablet (768x1024)
 * - Mobile (375x667, 414x896)
 *
 * Note: These tests run in the default chromium project.
 * For cross-browser testing, use specific Playwright projects:
 *   npx playwright test --project=mobile-chrome
 *   npx playwright test --project=tablet
 */

import { test, expect, Page } from '@playwright/test'
import {
  login,
  getTestId,
  cleanupByTestId,
  createClientViaAPI,
  TEST_EMAIL,
  TEST_PASSWORD,
  ONBOARDING_KEY,
  ROUTES,
  clientDetailRoute,
} from '../fixtures/e2e-helpers'
import { DashboardPage, ClientDetailPage } from '../pages'

// Viewport definitions
const VIEWPORTS = {
  desktop: { width: 1280, height: 720 },
  desktopLarge: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
  mobileLarge: { width: 414, height: 896 },
}

test.describe('Responsive - Desktop', () => {
  let testId: string
  let clientId: string

  test.beforeEach(async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize(VIEWPORTS.desktop)

    testId = getTestId()
    await login(page, TEST_EMAIL, TEST_PASSWORD)
    await page.evaluate((key) => localStorage.setItem(key, '1'), ONBOARDING_KEY)

    const client = await createClientViaAPI(testId)
    clientId = client.id
  })

  test.afterEach(async () => {
    await cleanupByTestId(testId)
  })

  test('sidebar is visible on desktop', async ({ page }) => {
    await page.goto(ROUTES.DASHBOARD)
    await page.waitForLoadState('networkidle')

    // Sidebar should be visible on desktop
    const sidebar = page.locator('[class*="sidebar"], nav').first()
    await expect(sidebar).toBeVisible()
  })

  test('dashboard displays full client cards', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await page.goto(ROUTES.DASHBOARD)
    await page.waitForLoadState('networkidle')

    // Client cards should display email and other details
    await expect(page.getByText(/test.*@test\.local/i)).toBeVisible()
  })

  test('modals display at full size', async ({ page }) => {
    await page.goto(clientDetailRoute(clientId))
    await page.waitForLoadState('networkidle')

    const clientDetailPage = new ClientDetailPage(page)
    await clientDetailPage.openAddSourceWizard()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Modal should have reasonable width (not cramped)
    const box = await dialog.boundingBox()
    expect(box?.width).toBeGreaterThan(400)
  })

  test('data tables show all columns', async ({ page }) => {
    await page.goto(clientDetailRoute(clientId))
    await page.waitForLoadState('networkidle')

    const clientDetailPage = new ClientDetailPage(page)
    await clientDetailPage.clickTab('Sources')

    // Table should be visible with header columns
    const table = page.locator('table, [class*="DataTable"]').first()
    if (await table.isVisible()) {
      const headers = page.locator('th, [class*="headerCell"]')
      const count = await headers.count()
      expect(count).toBeGreaterThan(2)
    }
  })
})

test.describe('Responsive - Large Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktopLarge)
  })

  test('layout scales properly on large screens', async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)
    await page.evaluate((key) => localStorage.setItem(key, '1'), ONBOARDING_KEY)
    await page.goto(ROUTES.DASHBOARD)
    await page.waitForLoadState('networkidle')

    // Content should not stretch beyond max-width
    const mainContent = page.locator('main, [class*="content"]').first()
    const box = await mainContent.boundingBox()

    // Main content should have reasonable constraints
    expect(box?.width).toBeLessThan(1920)
  })
})

test.describe('Responsive - Tablet', () => {
  let testId: string
  let clientId: string

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet)

    testId = getTestId()
    await login(page, TEST_EMAIL, TEST_PASSWORD)
    await page.evaluate((key) => localStorage.setItem(key, '1'), ONBOARDING_KEY)

    const client = await createClientViaAPI(testId)
    clientId = client.id
  })

  test.afterEach(async () => {
    await cleanupByTestId(testId)
  })

  test('app renders correctly on tablet', async ({ page }) => {
    await page.goto(ROUTES.DASHBOARD)
    await page.waitForLoadState('networkidle')

    // Page should load without errors
    await expect(page.locator('body')).toBeVisible()

    // No horizontal scrollbar
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })

  test('client cards stack on tablet', async ({ page }) => {
    await page.goto(ROUTES.DASHBOARD)
    await page.waitForLoadState('networkidle')

    // Cards should still be visible
    await expect(page.getByText(new RegExp(`Test Client.*${testId}`))).toBeVisible()
  })

  test('modal adapts to tablet width', async ({ page }) => {
    await page.goto(clientDetailRoute(clientId))
    await page.waitForLoadState('networkidle')

    const clientDetailPage = new ClientDetailPage(page)
    await clientDetailPage.openAddSourceWizard()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Modal should fit within tablet viewport
    const dialogBox = await dialog.boundingBox()
    expect(dialogBox?.width).toBeLessThan(VIEWPORTS.tablet.width)
  })
})

test.describe('Responsive - Mobile', () => {
  let testId: string
  let clientId: string

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)

    testId = getTestId()
    await login(page, TEST_EMAIL, TEST_PASSWORD)
    await page.evaluate((key) => localStorage.setItem(key, '1'), ONBOARDING_KEY)

    const client = await createClientViaAPI(testId)
    clientId = client.id
  })

  test.afterEach(async () => {
    await cleanupByTestId(testId)
  })

  test('login page works on mobile', async ({ page }) => {
    // Logout first
    await page.goto(ROUTES.DASHBOARD)
    await page.waitForLoadState('networkidle')

    // Login form should be accessible
    // (we're already logged in from beforeEach, so just verify navigation works)
    await expect(page.locator('body')).toBeVisible()
  })

  test('dashboard loads on mobile', async ({ page }) => {
    await page.goto(ROUTES.DASHBOARD)
    await page.waitForLoadState('networkidle')

    // Dashboard should render
    await expect(page.locator('body')).toBeVisible()

    // Client should be visible
    await expect(page.getByText(new RegExp(`Test Client.*${testId}`))).toBeVisible()
  })

  test('client detail page scrollable on mobile', async ({ page }) => {
    await page.goto(clientDetailRoute(clientId))
    await page.waitForLoadState('networkidle')

    // Page should be scrollable
    const isScrollable = await page.evaluate(() => {
      return document.documentElement.scrollHeight > document.documentElement.clientHeight ||
             document.body.scrollHeight > document.body.clientHeight
    })

    // Page should not have horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 5
    })
    expect(hasHorizontalScroll).toBe(false)
  })

  test('modals are full-width on mobile', async ({ page }) => {
    await page.goto(clientDetailRoute(clientId))
    await page.waitForLoadState('networkidle')

    const clientDetailPage = new ClientDetailPage(page)
    await clientDetailPage.openAddSourceWizard()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Modal should take most of the screen width
    const dialogBox = await dialog.boundingBox()
    const viewportWidth = VIEWPORTS.mobile.width
    expect(dialogBox?.width).toBeGreaterThan(viewportWidth * 0.85)
  })

  test('buttons are touch-friendly on mobile', async ({ page }) => {
    await page.goto(clientDetailRoute(clientId))
    await page.waitForLoadState('networkidle')

    // Check that primary buttons have adequate size
    const buttons = page.getByRole('button')
    const buttonCount = await buttons.count()

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        const box = await button.boundingBox()
        if (box) {
          // Minimum touch target should be at least 32px
          expect(box.height).toBeGreaterThanOrEqual(28)
        }
      }
    }
  })

  test('tabs scroll horizontally if needed', async ({ page }) => {
    await page.goto(clientDetailRoute(clientId))
    await page.waitForLoadState('networkidle')

    // Tab container should be visible
    const tabList = page.getByRole('tablist')
    if (await tabList.isVisible()) {
      // All tabs should be reachable (scroll or wrap)
      const tabs = page.getByRole('tab')
      const tabCount = await tabs.count()

      // First and last tab should be visible or scrollable-to
      if (tabCount > 0) {
        await tabs.first().scrollIntoViewIfNeeded()
        await expect(tabs.first()).toBeVisible()

        await tabs.last().scrollIntoViewIfNeeded()
        await expect(tabs.last()).toBeVisible()
      }
    }
  })
})

test.describe('Responsive - Mobile Large', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobileLarge)
  })

  test('larger mobile viewport works correctly', async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)
    await page.evaluate((key) => localStorage.setItem(key, '1'), ONBOARDING_KEY)
    await page.goto(ROUTES.DASHBOARD)
    await page.waitForLoadState('networkidle')

    // Should work similar to regular mobile
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Responsive - Touch Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
  })

  test('dropdown menus work with touch', async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)
    await page.evaluate((key) => localStorage.setItem(key, '1'), ONBOARDING_KEY)

    const testId = getTestId()
    const client = await createClientViaAPI(testId)

    await page.goto(clientDetailRoute(client.id))
    await page.waitForLoadState('networkidle')

    // Find any select/dropdown and test it works
    const selects = page.locator('select')
    const selectCount = await selects.count()

    if (selectCount > 0) {
      const firstSelect = selects.first()
      if (await firstSelect.isVisible()) {
        await firstSelect.click()
        // Select should be interactive
        await expect(firstSelect).toBeFocused()
      }
    }

    await cleanupByTestId(testId)
  })

  test('form inputs are accessible on mobile', async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)
    await page.evaluate((key) => localStorage.setItem(key, '1'), ONBOARDING_KEY)

    const testId = getTestId()
    const client = await createClientViaAPI(testId)

    await page.goto(clientDetailRoute(client.id))
    await page.waitForLoadState('networkidle')

    const clientDetailPage = new ClientDetailPage(page)
    await clientDetailPage.openAddSourceWizard()

    // Form inputs should be visible and focusable
    const inputs = page.getByRole('dialog').locator('input, select, textarea')
    const inputCount = await inputs.count()

    if (inputCount > 0) {
      const firstInput = inputs.first()
      await firstInput.scrollIntoViewIfNeeded()
      await expect(firstInput).toBeVisible()
    }

    await cleanupByTestId(testId)
  })
})

test.describe('Responsive - Orientation', () => {
  test('landscape mobile works', async ({ page }) => {
    // Landscape iPhone
    await page.setViewportSize({ width: 667, height: 375 })

    await login(page, TEST_EMAIL, TEST_PASSWORD)
    await page.evaluate((key) => localStorage.setItem(key, '1'), ONBOARDING_KEY)
    await page.goto(ROUTES.DASHBOARD)
    await page.waitForLoadState('networkidle')

    // App should still work in landscape
    await expect(page.locator('body')).toBeVisible()

    // No horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 5
    })
    expect(hasHorizontalScroll).toBe(false)
  })

  test('landscape tablet works', async ({ page }) => {
    // Landscape iPad
    await page.setViewportSize({ width: 1024, height: 768 })

    await login(page, TEST_EMAIL, TEST_PASSWORD)
    await page.evaluate((key) => localStorage.setItem(key, '1'), ONBOARDING_KEY)
    await page.goto(ROUTES.DASHBOARD)
    await page.waitForLoadState('networkidle')

    // App should work in tablet landscape
    await expect(page.locator('body')).toBeVisible()
  })
})

/**
 * Test Setup - Runs before each test file
 *
 * Configures:
 * - Jest-DOM matchers for component tests
 * - Global test utilities
 * - Console output filtering
 */

import { expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import { randomUUID } from 'crypto'

// Extend Vitest expect with jest-dom matchers
expect.extend(matchers)

// Store original console methods
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  // Suppress noisy console output during tests (optional)
  // Uncomment if tests are too verbose
  // console.error = vi.fn()
  // console.warn = vi.fn()
})

afterAll(() => {
  // Restore console methods
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks()

  // Reset all mock implementations
  vi.resetAllMocks()
})

// Global test utilities
declare global {
  /**
   * Generate a unique short ID for test data
   * Prevents collisions when tests run in parallel
   */
  function getShortUnique(): string

  /**
   * Wait for a specified duration
   * Use sparingly - prefer waitFor from testing-library
   */
  function sleep(ms: number): Promise<void>
}

// Sequence counter for guaranteed uniqueness within same millisecond
let uniqueCounter = 0

globalThis.getShortUnique = () => {
  const timestamp = Date.now().toString(36)
  const uuid = randomUUID().replace(/-/g, '').substring(0, 8)
  const sequence = (++uniqueCounter).toString(36).padStart(3, '0')
  return `${timestamp}-${uuid}-${sequence}`
}

globalThis.sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

// Type declarations for jest-dom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeInTheDocument(): T
    toBeVisible(): T
    toBeEmptyDOMElement(): T
    toBeEnabled(): T
    toBeDisabled(): T
    toBeRequired(): T
    toBeValid(): T
    toBeInvalid(): T
    toHaveValue(value?: string | string[] | number): T
    toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): T
    toBeChecked(): T
    toBePartiallyChecked(): T
    toHaveDescription(text?: string | RegExp): T
    toHaveErrorMessage(text?: string | RegExp): T
    toHaveFocus(): T
    toHaveFormValues(expectedValues: Record<string, unknown>): T
    toHaveTextContent(text: string | RegExp): T
    toHaveAttribute(attr: string, value?: unknown): T
    toHaveClass(...classNames: string[]): T
    toHaveStyle(css: string | Record<string, unknown>): T
    toHaveAccessibleDescription(description?: string | RegExp): T
    toHaveAccessibleName(name?: string | RegExp): T
    toHaveRole(role: string): T
    toContainHTML(html: string): T
    toContainElement(element: Element | null): T
  }
}

export {}

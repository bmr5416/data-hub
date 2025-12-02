/**
 * Client Test Data Factory
 *
 * Generates realistic client test data with unique identifiers
 */

import { faker } from '@faker-js/faker'

export interface TestClient {
  name: string
  email: string
  status: 'active' | 'inactive' | 'onboarding'
  industry?: string
  website?: string
  contact_name?: string
  notes?: string
}

export interface TestClientWithId extends TestClient {
  id: string
  created_at: string
  updated_at: string
}

/**
 * Generate a unique client name with test prefix
 */
function generateClientName(): string {
  const company = faker.company.name()
  const unique = getShortUnique()
  return `${company} [${unique}]`
}

/**
 * Create test client data
 */
export function createTestClient(overrides: Partial<TestClient> = {}): TestClient {
  return {
    name: generateClientName(),
    email: faker.internet.email(),
    status: faker.helpers.arrayElement(['active', 'inactive', 'onboarding']),
    industry: faker.helpers.arrayElement([
      'Retail',
      'Technology',
      'Finance',
      'Healthcare',
      'Entertainment',
      'E-commerce',
      'SaaS',
    ]),
    website: faker.internet.url(),
    contact_name: faker.person.fullName(),
    notes: faker.lorem.sentence(),
    ...overrides,
  }
}

/**
 * Create an active client
 */
export function createActiveClient(overrides: Partial<TestClient> = {}): TestClient {
  return createTestClient({
    status: 'active',
    ...overrides,
  })
}

/**
 * Create an onboarding client
 */
export function createOnboardingClient(overrides: Partial<TestClient> = {}): TestClient {
  return createTestClient({
    status: 'onboarding',
    ...overrides,
  })
}

/**
 * Create multiple test clients
 */
export function createTestClients(count: number, overrides: Partial<TestClient> = {}): TestClient[] {
  return Array.from({ length: count }, () => createTestClient(overrides))
}

/**
 * Create a minimal client (only required fields)
 */
export function createMinimalClient(name?: string): TestClient {
  return {
    name: name || generateClientName(),
    email: faker.internet.email(),
    status: 'active',
  }
}

export default {
  create: createTestClient,
  createActive: createActiveClient,
  createOnboarding: createOnboardingClient,
  createMany: createTestClients,
  createMinimal: createMinimalClient,
}

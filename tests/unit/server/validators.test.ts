/**
 * Validators Unit Tests
 *
 * Comprehensive tests for server/services/validators.js
 */

import { describe, it, expect } from 'vitest'
import {
  validateUUID,
  validateEntityId,
  validateString,
  validateArray,
  validateBoolean,
  validateObject,
  validateWarehouseCreate,
  validateWarehouseUpdate,
} from '../../../server/services/validators.js'

describe('Validators', () => {
  // ============================================================
  // validateUUID
  // ============================================================
  describe('validateUUID', () => {
    const validUUIDs = [
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-41d4-80b4-00c04fd430c8',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    ]

    const invalidUUIDs = [
      'not-a-uuid',
      '550e8400-e29b-41d4-a716', // too short
      '550e8400-e29b-11d4-a716-446655440000', // version 1, not 4
      '550e8400-e29b-41d4-c716-446655440000', // invalid variant (c instead of 8,9,a,b)
      '550e8400e29b41d4a716446655440000', // no hyphens
      '',
      '   ',
    ]

    it.each(validUUIDs)('should accept valid UUID: %s', (uuid) => {
      expect(validateUUID(uuid)).toBe(uuid)
    })

    it.each(invalidUUIDs)('should reject invalid UUID: %s', (uuid) => {
      expect(() => validateUUID(uuid)).toThrow()
    })

    it('should throw for null value', () => {
      expect(() => validateUUID(null)).toThrow('id is required')
    })

    it('should throw for undefined value', () => {
      expect(() => validateUUID(undefined)).toThrow('id is required')
    })

    it('should throw for non-string value', () => {
      expect(() => validateUUID(12345 as any)).toThrow('id is required')
    })

    it('should use custom field name in error message', () => {
      expect(() => validateUUID(null, 'clientId')).toThrow('clientId is required')
    })

    it('should include "valid UUID" in error for format issues', () => {
      expect(() => validateUUID('invalid', 'userId')).toThrow('userId must be a valid UUID')
    })

    it('should accept UUID with uppercase letters (case insensitive)', () => {
      expect(validateUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(
        '550E8400-E29B-41D4-A716-446655440000',
      )
    })
  })

  // ============================================================
  // validateEntityId
  // ============================================================
  describe('validateEntityId', () => {
    const validEntityIds = [
      'c-12345678', // 1-letter prefix
      'wh-abcdef12', // 2-letter prefix
      's-a1b2c3d4',
      'r-00000000',
      '550e8400-e29b-41d4-a716-446655440000', // UUID also valid
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    ]

    const invalidEntityIds = [
      'c-1234567', // too short (7 chars after prefix)
      'c-123456789', // too long (9 chars after prefix)
      'abc-12345678', // prefix too long (3 letters)
      'CLIENT-12345678', // prefix too long (6 letters)
      '12345678', // no prefix
      'c_12345678', // wrong separator
      '',
    ]

    it.each(validEntityIds)('should accept valid entity ID: %s', (id) => {
      expect(validateEntityId(id)).toBe(id)
    })

    it.each(invalidEntityIds)('should reject invalid entity ID: %s', (id) => {
      expect(() => validateEntityId(id)).toThrow()
    })

    it('should throw for null value', () => {
      expect(() => validateEntityId(null)).toThrow('id is required')
    })

    it('should throw for undefined value', () => {
      expect(() => validateEntityId(undefined)).toThrow('id is required')
    })

    it('should use custom field name in error message', () => {
      expect(() => validateEntityId('invalid', 'sourceId')).toThrow('sourceId must be a valid ID')
    })

    it('should accept uppercase prefix (case insensitive)', () => {
      expect(validateEntityId('C-12345678')).toBe('C-12345678')
      expect(validateEntityId('WH-ABCDEF12')).toBe('WH-ABCDEF12')
    })
  })

  // ============================================================
  // validateString
  // ============================================================
  describe('validateString', () => {
    describe('required validation', () => {
      it('should accept non-empty string when required', () => {
        expect(validateString('hello', 'name')).toBe('hello')
      })

      it('should throw for empty string when required', () => {
        expect(() => validateString('', 'name')).toThrow('name is required')
      })

      it('should throw for null when required', () => {
        expect(() => validateString(null, 'name')).toThrow('name is required')
      })

      it('should throw for undefined when required', () => {
        expect(() => validateString(undefined, 'name')).toThrow('name is required')
      })

      it('should allow empty string when not required', () => {
        expect(validateString('', 'name', { required: false })).toBe('')
      })

      it('should allow null when not required', () => {
        expect(validateString(null, 'name', { required: false })).toBeNull()
      })
    })

    describe('length validation', () => {
      it('should accept string meeting minLength', () => {
        expect(validateString('hello', 'name', { minLength: 5 })).toBe('hello')
      })

      it('should throw for string below minLength', () => {
        expect(() => validateString('hi', 'name', { minLength: 5 })).toThrow(
          'name must be at least 5 characters',
        )
      })

      it('should accept string at maxLength', () => {
        expect(validateString('hello', 'name', { maxLength: 5 })).toBe('hello')
      })

      it('should throw for string above maxLength', () => {
        expect(() => validateString('hello world', 'name', { maxLength: 5 })).toThrow(
          'name must be at most 5 characters',
        )
      })

      it('should respect default maxLength of 255', () => {
        const longString = 'a'.repeat(256)
        expect(() => validateString(longString, 'name')).toThrow('name must be at most 255 characters')
      })
    })

    describe('type validation', () => {
      it('should throw for non-string types', () => {
        expect(() => validateString(123 as any, 'name')).toThrow('name must be a string')
        expect(() => validateString([] as any, 'name')).toThrow('name must be a string')
        expect(() => validateString({} as any, 'name')).toThrow('name must be a string')
      })
    })
  })

  // ============================================================
  // validateArray
  // ============================================================
  describe('validateArray', () => {
    describe('required validation', () => {
      it('should accept non-empty array when required', () => {
        expect(validateArray([1, 2, 3], 'items')).toEqual([1, 2, 3])
      })

      it('should throw for empty array when required', () => {
        expect(() => validateArray([], 'items')).toThrow(
          'items is required and must be a non-empty array',
        )
      })

      it('should throw for null when required', () => {
        expect(() => validateArray(null, 'items')).toThrow(
          'items is required and must be a non-empty array',
        )
      })

      it('should allow empty array when not required', () => {
        expect(validateArray([], 'items', { required: false })).toEqual([])
      })
    })

    describe('minLength validation', () => {
      it('should accept array meeting minLength', () => {
        expect(validateArray([1, 2, 3], 'items', { minLength: 3 })).toEqual([1, 2, 3])
      })

      it('should throw for array below minLength', () => {
        expect(() => validateArray([1], 'items', { minLength: 3 })).toThrow(
          'items must have at least 3 items',
        )
      })
    })

    describe('itemType validation', () => {
      it('should accept array with correct item types', () => {
        expect(validateArray(['a', 'b', 'c'], 'items', { itemType: 'string' })).toEqual([
          'a',
          'b',
          'c',
        ])
      })

      it('should throw for array with wrong item types', () => {
        expect(() => validateArray([1, 'b', 3], 'items', { itemType: 'string' })).toThrow(
          'items[0] must be a string',
        )
      })

      it('should identify the correct index of invalid item', () => {
        expect(() => validateArray(['a', 'b', 3], 'items', { itemType: 'string' })).toThrow(
          'items[2] must be a string',
        )
      })
    })

    describe('type validation', () => {
      it('should throw for non-array types', () => {
        expect(() => validateArray('not an array' as any, 'items', { required: false })).toThrow(
          'items must be an array',
        )
      })
    })
  })

  // ============================================================
  // validateBoolean
  // ============================================================
  describe('validateBoolean', () => {
    it('should accept true', () => {
      expect(validateBoolean(true, 'flag')).toBe(true)
    })

    it('should accept false', () => {
      expect(validateBoolean(false, 'flag')).toBe(false)
    })

    it('should return undefined for missing optional value', () => {
      expect(validateBoolean(undefined, 'flag')).toBeUndefined()
    })

    it('should return defaultValue for missing value', () => {
      expect(validateBoolean(undefined, 'flag', { defaultValue: true })).toBe(true)
    })

    it('should throw for missing required value', () => {
      expect(() => validateBoolean(undefined, 'flag', { required: true })).toThrow(
        'flag is required',
      )
    })

    it('should throw for non-boolean types', () => {
      expect(() => validateBoolean('true' as any, 'flag')).toThrow('flag must be a boolean')
      expect(() => validateBoolean(1 as any, 'flag')).toThrow('flag must be a boolean')
      expect(() => validateBoolean(0 as any, 'flag')).toThrow('flag must be a boolean')
    })
  })

  // ============================================================
  // validateObject
  // ============================================================
  describe('validateObject', () => {
    it('should accept valid objects', () => {
      expect(validateObject({ key: 'value' }, 'data')).toEqual({ key: 'value' })
    })

    it('should accept empty objects', () => {
      expect(validateObject({}, 'data')).toEqual({})
    })

    it('should throw for arrays (not plain objects)', () => {
      expect(() => validateObject([], 'data')).toThrow('data is required and must be an object')
    })

    it('should throw for null when required', () => {
      expect(() => validateObject(null, 'data')).toThrow('data is required and must be an object')
    })

    it('should allow null when not required', () => {
      expect(validateObject(null, 'data', { required: false })).toBeNull()
    })

    it('should throw for non-object types', () => {
      expect(() => validateObject('string' as any, 'data', { required: false })).toThrow(
        'data must be an object',
      )
    })
  })

  // ============================================================
  // validateWarehouseCreate
  // ============================================================
  describe('validateWarehouseCreate', () => {
    const validWarehouseData = {
      name: 'Test Warehouse',
      platforms: ['meta_ads'],
      fieldSelections: {
        meta_ads: {
          dimensions: ['date', 'campaign_name'],
          metrics: ['impressions', 'clicks'],
        },
      },
      includeBlendedTable: true,
    }

    it('should accept valid warehouse data', () => {
      const result = validateWarehouseCreate(validWarehouseData)
      expect(result).toMatchObject({
        name: 'Test Warehouse',
        platforms: ['meta_ads'],
        includeBlendedTable: true,
      })
    })

    it('should default includeBlendedTable to true', () => {
      const dataWithoutBlended = { ...validWarehouseData }
      delete dataWithoutBlended.includeBlendedTable
      const result = validateWarehouseCreate(dataWithoutBlended)
      expect(result.includeBlendedTable).toBe(true)
    })

    it('should allow name to be optional', () => {
      const dataWithoutName = { ...validWarehouseData, name: undefined }
      expect(() => validateWarehouseCreate(dataWithoutName)).not.toThrow()
    })

    it('should throw for missing platforms', () => {
      const invalidData = { ...validWarehouseData, platforms: [] }
      expect(() => validateWarehouseCreate(invalidData)).toThrow(
        'platforms is required and must be a non-empty array',
      )
    })

    it('should throw for missing fieldSelections', () => {
      const invalidData = { ...validWarehouseData, fieldSelections: null }
      expect(() => validateWarehouseCreate(invalidData)).toThrow(
        'fieldSelections is required and must be an object',
      )
    })

    it('should throw when platform missing from fieldSelections', () => {
      const invalidData = {
        ...validWarehouseData,
        platforms: ['meta_ads', 'google_ads'],
      }
      expect(() => validateWarehouseCreate(invalidData)).toThrow(
        'Field selections missing for platform: google_ads',
      )
    })

    it('should throw when dimensions are empty', () => {
      const invalidData = {
        ...validWarehouseData,
        fieldSelections: {
          meta_ads: {
            dimensions: [],
            metrics: ['impressions'],
          },
        },
      }
      expect(() => validateWarehouseCreate(invalidData)).toThrow(
        'fieldSelections.meta_ads.dimensions is required and must be a non-empty array',
      )
    })

    it('should throw when metrics are empty', () => {
      const invalidData = {
        ...validWarehouseData,
        fieldSelections: {
          meta_ads: {
            dimensions: ['date'],
            metrics: [],
          },
        },
      }
      expect(() => validateWarehouseCreate(invalidData)).toThrow(
        'fieldSelections.meta_ads.metrics is required and must be a non-empty array',
      )
    })

    it('should validate multiple platforms', () => {
      const multiPlatformData = {
        name: 'Multi Platform Warehouse',
        platforms: ['meta_ads', 'google_ads'],
        fieldSelections: {
          meta_ads: {
            dimensions: ['date'],
            metrics: ['impressions'],
          },
          google_ads: {
            dimensions: ['date'],
            metrics: ['clicks'],
          },
        },
      }
      const result = validateWarehouseCreate(multiPlatformData)
      expect(result.platforms).toHaveLength(2)
    })
  })

  // ============================================================
  // validateWarehouseUpdate
  // ============================================================
  describe('validateWarehouseUpdate', () => {
    it('should accept empty update (no fields)', () => {
      const result = validateWarehouseUpdate({})
      expect(result).toEqual({})
    })

    it('should validate name when provided', () => {
      const result = validateWarehouseUpdate({ name: 'New Name' })
      expect(result.name).toBe('New Name')
    })

    it('should validate platforms when provided', () => {
      const result = validateWarehouseUpdate({ platforms: ['meta_ads'] })
      expect(result.platforms).toEqual(['meta_ads'])
    })

    it('should throw for invalid platforms', () => {
      expect(() => validateWarehouseUpdate({ platforms: [] })).toThrow(
        'platforms must have at least 1 items',
      )
    })

    it('should validate fieldSelections when provided', () => {
      const result = validateWarehouseUpdate({
        fieldSelections: { meta_ads: { dimensions: ['date'], metrics: ['spend'] } },
      })
      expect(result.fieldSelections).toBeDefined()
    })

    it('should validate includeBlendedTable when provided', () => {
      const result = validateWarehouseUpdate({ includeBlendedTable: false })
      expect(result.includeBlendedTable).toBe(false)
    })

    it('should not include undefined fields in result', () => {
      const result = validateWarehouseUpdate({ name: 'Test' })
      expect(Object.keys(result)).toEqual(['name'])
    })

    it('should handle all fields provided together', () => {
      const allFields = {
        name: 'Updated Warehouse',
        platforms: ['meta_ads', 'google_ads'],
        fieldSelections: {
          meta_ads: { dimensions: ['date'], metrics: ['spend'] },
          google_ads: { dimensions: ['date'], metrics: ['clicks'] },
        },
        includeBlendedTable: false,
      }
      const result = validateWarehouseUpdate(allFields)
      expect(result.name).toBe('Updated Warehouse')
      expect(result.platforms).toEqual(['meta_ads', 'google_ads'])
      expect(result.fieldSelections).toBeDefined()
      expect(result.includeBlendedTable).toBe(false)
    })
  })
})

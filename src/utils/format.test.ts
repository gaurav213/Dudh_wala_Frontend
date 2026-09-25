import { describe, expect, it } from 'vitest'
import { formatLiters, formatQuantity } from './format'

describe('formatQuantity', () => {
  it('omits decimals for whole numbers', () => {
    expect(formatQuantity(1)).toBe('1')
    expect(formatQuantity('2.000')).toBe('2')
    expect(formatQuantity(0)).toBe('0')
  })

  it('keeps a single decimal place', () => {
    expect(formatQuantity(1.5)).toBe('1.5')
    expect(formatQuantity('1.50')).toBe('1.5')
    expect(formatQuantity('0.500')).toBe('0.5')
    expect(formatQuantity(1.25)).toBe('1.3')
  })

  it('handles empty values', () => {
    expect(formatQuantity(null)).toBe('—')
    expect(formatQuantity(undefined)).toBe('—')
    expect(formatQuantity('')).toBe('—')
  })
})

describe('formatLiters', () => {
  it('adds L suffix', () => {
    expect(formatLiters('1.000')).toBe('1 L')
    expect(formatLiters('1.500')).toBe('1.5 L')
  })
})

import { describe, it, expect } from 'vitest'

describe('Vitest setup', () => {
  it('runs tests', () => {
    expect(1 + 1).toBe(2)
  })

  it('handles async', async () => {
    const result = await Promise.resolve('hello')
    expect(result).toBe('hello')
  })
})

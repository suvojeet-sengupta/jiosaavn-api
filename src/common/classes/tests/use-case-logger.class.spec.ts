import { describe, expect, it, vi } from 'vitest'
import { UseCaseLogger } from '#common/classes'

describe('UseCaseLogger', () => {
  it('forwards info / warn / error to the tagged logger without throwing', () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const logger = new UseCaseLogger('Test')

    expect(() => logger.info('info message', { a: 1 })).not.toThrow()
    expect(() => logger.warn('warn message')).not.toThrow()
    expect(() => logger.error('error message', new Error('boom'), { b: 2 })).not.toThrow()

    vi.restoreAllMocks()
  })
})

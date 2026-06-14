import { describe, expect, it } from 'vitest'
import { safeJsonParse } from '#common/utils'

describe('safeJsonParse', () => {
  it('parses valid json', () => {
    expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 })
  })

  it('returns the fallback for invalid json', () => {
    expect(safeJsonParse('not json')).toBeNull()
    expect(safeJsonParse('also not json', [])).toEqual([])
  })

  it('returns the fallback for empty input', () => {
    expect(safeJsonParse(undefined, [])).toEqual([])
    expect(safeJsonParse(null)).toBeNull()
  })
})

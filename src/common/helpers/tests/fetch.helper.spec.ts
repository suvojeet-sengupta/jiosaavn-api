import { HTTPException } from 'hono/http-exception'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { useFetch } from '#common/helpers'

const stubFetch = (impl: () => Response) => vi.stubGlobal('fetch', vi.fn(impl))

describe('useFetch', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns parsed data when the schema matches', async () => {
    stubFetch(() => Response.json({ id: '1' }, { status: 200 }))
    const data = await useFetch({ endpoint: 'x', params: {}, schema: z.object({ id: z.string() }) })
    expect(data).toEqual({ id: '1' })
  })

  it('returns the raw body when no schema is given', async () => {
    stubFetch(() => Response.json({ any: true }, { status: 200 }))
    const data = await useFetch({ endpoint: 'x', params: { p: 1 } })
    expect(data).toEqual({ any: true })
  })

  it('passes the raw body through on schema drift', async () => {
    stubFetch(() => Response.json({ id: 1 }, { status: 200 }))
    const data = await useFetch({ endpoint: 'x', params: {}, schema: z.object({ id: z.string() }) })
    expect(data).toEqual({ id: 1 })
  })

  it('throws when the response is not ok', async () => {
    stubFetch(() => new Response('err', { status: 500 }))
    await expect(useFetch({ endpoint: 'x', params: {} })).rejects.toThrow(HTTPException)
  })

  it('throws on a non-JSON body', async () => {
    stubFetch(() => new Response('<html>not json</html>', { status: 200 }))
    await expect(useFetch({ endpoint: 'x', params: {} })).rejects.toThrow(HTTPException)
  })

  it('throws when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        throw new Error('network down')
      })
    )
    await expect(useFetch({ endpoint: 'x', params: {} })).rejects.toThrow(HTTPException)
  })

  it('throws on request timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        const error = new Error('timed out')
        error.name = 'TimeoutError'
        throw error
      })
    )
    await expect(useFetch({ endpoint: 'x', params: {} })).rejects.toThrow(HTTPException)
  })
})

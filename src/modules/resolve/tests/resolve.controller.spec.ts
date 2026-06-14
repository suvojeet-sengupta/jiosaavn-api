import { beforeAll, describe, expect, it } from 'vitest'
import { ResolveController } from '#modules/index'
import { ResolveResultModel } from '#modules/resolve/resolve.model'

describe('ResolveController', () => {
  let controller: ResolveController

  beforeAll(() => {
    controller = new ResolveController()
  })

  const parse = async (url: string) => {
    const response = await controller.controller.request(`/resolve?url=${encodeURIComponent(url)}`)
    const data = await response.json()
    expect(() => ResolveResultModel.parse(data)).not.toThrow()
  }

  it('resolves a song link', () => parse('https://www.jiosaavn.com/song/houdini/OgwhbhtDRwM'))

  it('resolves an album link', () => parse('https://www.jiosaavn.com/album/x/ITIyo-GDr7A_'))

  it('resolves an artist link', () => parse('https://www.jiosaavn.com/artist/x/bQVPhRbZO1I_'))

  it('resolves a playlist link', () => parse('https://www.jiosaavn.com/featured/its-indie-english/AMoxtXyKHoU_'))

  it('rejects an unrecognized link', async () => {
    const response = await controller.controller.request(
      `/resolve?url=${encodeURIComponent('https://example.com/foo')}`
    )
    expect(response.status).toBe(400)
  })
})

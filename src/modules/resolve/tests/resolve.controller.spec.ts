import { ResolveController } from '#modules/index'
import { ResolveResultModel } from '#modules/resolve/resolve.model'
import { beforeAll, describe, expect, it } from 'vitest'

describe('ResolveController', () => {
  let controller: ResolveController

  beforeAll(() => {
    controller = new ResolveController()
    controller.initRoutes()
  })

  const parse = async (url: string) => {
    const response = await controller.controller.request(`/resolve?url=${encodeURIComponent(url)}`)
    const data = await response.json()
    expect(() => ResolveResultModel.parse(data)).not.toThrow()
  }

  it('resolves a song link', () => parse('https://www.jiosaavn.com/song/houdini/OgwhbhtDRwM'))

  it('resolves a playlist link', () => parse('https://www.jiosaavn.com/featured/its-indie-english/AMoxtXyKHoU_'))
})

import { ArtistModel } from '#modules/artists/models'
import { ArtistController } from '#modules/index'
import { beforeAll, describe, expect, it } from 'vitest'

describe('ArtistController', () => {
  let controller: ArtistController

  beforeAll(() => {
    controller = new ArtistController()
    controller.initRoutes()
  })

  it('get artist by id', async () => {
    const response = await controller.controller.request('/artists/1274170')
    const data = await response.json()
    expect(() => ArtistModel.parse(data)).not.toThrow()
  })
})

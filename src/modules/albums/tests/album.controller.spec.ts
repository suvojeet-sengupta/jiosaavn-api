import { AlbumModel } from '#modules/albums/album.model'
import { AlbumController } from '#modules/index'
import { beforeAll, describe, expect, it } from 'vitest'

describe('AlbumController', () => {
  let controller: AlbumController

  beforeAll(() => {
    controller = new AlbumController()
    controller.initRoutes()
  })

  it('get album by id', async () => {
    const response = await controller.controller.request('/albums/23241654')
    const data = await response.json()
    expect(() => AlbumModel.parse(data)).not.toThrow()
  })
})

import { PlaylistController } from '#modules/playlists/playlist.controller'
import { PlaylistModel } from '#modules/playlists/playlist.model'
import { beforeAll, describe, expect, it } from 'vitest'

describe('PlaylistController', () => {
  let controller: PlaylistController

  beforeAll(() => {
    controller = new PlaylistController()
    controller.initRoutes()
  })

  it('get playlist by id', async () => {
    const response = await controller.controller.request('/playlists/82914609')
    const data = await response.json()
    expect(() => PlaylistModel.parse(data)).not.toThrow()
  })
})

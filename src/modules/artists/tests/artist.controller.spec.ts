import { beforeAll, describe, expect, it } from 'vitest'
import { paginated } from '#common/models'
import { AlbumModel } from '#modules/albums/album.model'
import { ArtistModel } from '#modules/artists/models'
import { ArtistController } from '#modules/index'
import { SongModel } from '#modules/songs/models'

describe('ArtistController', () => {
  let controller: ArtistController

  beforeAll(() => {
    controller = new ArtistController()
  })

  it('get artist by id', async () => {
    const response = await controller.controller.request('/artists/1274170')
    const data = await response.json()
    expect(() => ArtistModel.parse(data)).not.toThrow()
  })

  it('get artist songs', async () => {
    const response = await controller.controller.request('/artists/1274170/songs')
    const data = await response.json()
    expect(() => paginated(SongModel).parse(data)).not.toThrow()
  })

  it('get artist albums', async () => {
    const response = await controller.controller.request('/artists/1274170/albums')
    const data = await response.json()
    expect(() => paginated(AlbumModel).parse(data)).not.toThrow()
  })
})

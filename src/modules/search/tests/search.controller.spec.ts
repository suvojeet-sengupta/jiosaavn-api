import { AlbumSummaryModel, ArtistSummaryModel, paginated, PlaylistSummaryModel } from '#common/models'
import { SearchController } from '#modules/index'
import { SearchResultModel } from '#modules/search/models'
import { SongModel } from '#modules/songs/models'
import { beforeAll, describe, expect, it } from 'vitest'

describe('SearchController', () => {
  let controller: SearchController

  beforeAll(() => {
    controller = new SearchController()
    controller.initRoutes()
  })

  const body = async (path: string) => {
    const response = await controller.controller.request(path)
    return response.json()
  }

  it('global search', async () => {
    const data = await body('/search?query=blurryface twenty one pilots')
    expect(() => SearchResultModel.parse(data)).not.toThrow()
  })

  it('search songs', async () => {
    const data = await body('/search/songs?query=believer')
    expect(() => paginated(SongModel).parse(data)).not.toThrow()
  })

  it('search albums', async () => {
    const data = await body('/search/albums?query=evolve')
    expect(() => paginated(AlbumSummaryModel).parse(data)).not.toThrow()
  })

  it('search artists', async () => {
    const data = await body('/search/artists?query=adele')
    expect(() => paginated(ArtistSummaryModel).parse(data)).not.toThrow()
  })

  it('search playlists', async () => {
    const data = await body('/search/playlists?query=indie')
    expect(() => paginated(PlaylistSummaryModel).parse(data)).not.toThrow()
  })
})

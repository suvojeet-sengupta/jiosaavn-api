import { beforeAll, describe, expect, it } from 'vitest'
import { paginated } from '#common/models'
import { PlaylistSummaryModel } from '#modules/playlists/playlist.model'
import { SearchPlaylistsUseCase } from '#modules/search/use-cases'

describe('SearchPlaylists', () => {
  let useCase: SearchPlaylistsUseCase

  beforeAll(() => {
    useCase = new SearchPlaylistsUseCase()
  })

  it('returns a paged list of playlist summaries', async () => {
    const result = await useCase.execute({ query: 'indie', limit: 5, page: 1 })

    expect(() => paginated(PlaylistSummaryModel).parse(result)).not.toThrow()
  })
})

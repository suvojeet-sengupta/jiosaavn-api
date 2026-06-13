import { beforeAll, describe, expect, it } from 'vitest'
import { paginated } from '#common/models'
import { AlbumSummaryModel } from '#modules/albums/album.model'
import { SearchAlbumsUseCase } from '#modules/search/use-cases'

describe('SearchAlbums', () => {
  let useCase: SearchAlbumsUseCase

  beforeAll(() => {
    useCase = new SearchAlbumsUseCase()
  })

  it('returns a paged list of album summaries', async () => {
    const result = await useCase.execute({ query: 'imagine dragons', limit: 5, page: 1 })

    expect(() => paginated(AlbumSummaryModel).parse(result)).not.toThrow()
  })
})

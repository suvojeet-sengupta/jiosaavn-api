import { beforeAll, describe, expect, it } from 'vitest'
import { paginated } from '#common/models'
import { ArtistSummaryModel } from '#modules/artists/models'
import { SearchArtistsUseCase } from '#modules/search/use-cases'

describe('SearchArtists', () => {
  let useCase: SearchArtistsUseCase

  beforeAll(() => {
    useCase = new SearchArtistsUseCase()
  })

  it('returns a paged list of artist summaries', async () => {
    const result = await useCase.execute({ query: 'imagine dragons', limit: 5, page: 1 })

    expect(() => paginated(ArtistSummaryModel).parse(result)).not.toThrow()
  })
})

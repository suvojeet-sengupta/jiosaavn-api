import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { toPage, useFetch } from '#common/helpers'
import { paginated } from '#common/models'
import { ArtistSummaryModel } from '#modules/artists/models'
import { SearchArtistAPIResponseModel, type SearchQuery } from '#modules/search/models'
import { artistResultToSummary } from '#modules/search/search.helper'
import type { z } from 'zod'

export class SearchArtistsUseCase extends useCase(paginated(ArtistSummaryModel)) {
  async execute({ query, page, limit }: z.infer<typeof SearchQuery>) {
    const data = await useFetch({
      endpoint: Endpoints.search.artists,
      params: { q: query, p: page - 1, n: limit },
      schema: SearchArtistAPIResponseModel
    })

    return toPage(data.results.map(artistResultToSummary), { page, limit, total: data.total })
  }
}

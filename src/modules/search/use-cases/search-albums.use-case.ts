import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { toPage, useFetch } from '#common/helpers'
import { paginated } from '#common/models'
import { AlbumSummaryModel } from '#modules/albums/album.model'
import { SearchAlbumAPIResponseModel, type SearchQuery } from '#modules/search/models'
import { albumResultToSummary } from '#modules/search/search.helper'
import type { z } from 'zod'

export class SearchAlbumsUseCase extends useCase(paginated(AlbumSummaryModel)) {
  async execute({ query, page, limit }: z.infer<typeof SearchQuery>) {
    const data = await useFetch({
      endpoint: Endpoints.search.albums,
      params: { q: query, p: page - 1, n: limit },
      schema: SearchAlbumAPIResponseModel
    })

    return toPage(data.results.map(albumResultToSummary), { page, limit, total: data.total })
  }
}

import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { toPage, useFetch } from '#common/helpers'
import { paginated } from '#common/models'
import { PlaylistSummaryModel } from '#modules/playlists/playlist.model'
import { SearchPlaylistAPIResponseModel, type SearchQuery } from '#modules/search/models'
import { playlistResultToSummary } from '#modules/search/search.helper'
import type { z } from 'zod'

export class SearchPlaylistsUseCase extends useCase(paginated(PlaylistSummaryModel)) {
  async execute({ query, page, limit }: z.infer<typeof SearchQuery>) {
    const data = await useFetch({
      endpoint: Endpoints.search.playlists,
      params: { q: query, p: page - 1, n: limit },
      schema: SearchPlaylistAPIResponseModel
    })

    return toPage(data.results.map(playlistResultToSummary), { page, limit, total: data.total })
  }
}

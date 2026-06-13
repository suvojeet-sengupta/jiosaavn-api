import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { toPage, useFetch } from '#common/helpers'
import { paginated, type PaginationQuery } from '#common/models'
import { toPlaylistSummary } from '#modules/browse/browse.helper'
import { FeaturedPlaylistsAPIResponseModel } from '#modules/browse/models'
import { PlaylistSummaryModel } from '#modules/playlists/playlist.model'
import type { z } from 'zod'

export class GetFeaturedPlaylistsUseCase extends useCase(paginated(PlaylistSummaryModel)) {
  async execute({ page, limit }: z.infer<typeof PaginationQuery>) {
    const data = await useFetch({
      endpoint: Endpoints.browse.featuredPlaylists,
      params: { p: page, n: limit },
      schema: FeaturedPlaylistsAPIResponseModel
    })

    return toPage(data.data.map(toPlaylistSummary), { page, limit, total: data.count ?? data.data.length })
  }
}

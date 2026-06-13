import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { toPage, useFetch } from '#common/helpers'
import { paginated, type PaginationQuery } from '#common/models'
import { toPlaylistSummary } from '#modules/browse/browse.helper'
import { FeedListAPIResponseModel } from '#modules/browse/models'
import { PlaylistSummaryModel } from '#modules/playlists/playlist.model'
import type { z } from 'zod'

export class GetChartsUseCase extends useCase(paginated(PlaylistSummaryModel)) {
  async execute({ page, limit }: z.infer<typeof PaginationQuery>) {
    const data = await useFetch({
      endpoint: Endpoints.browse.charts,
      params: {},
      schema: FeedListAPIResponseModel
    })

    const all = data.map(toPlaylistSummary)
    const start = (page - 1) * limit

    return toPage(all.slice(start, start + limit), { page, limit, total: all.length })
  }
}

import { z } from 'zod'
import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { toPage, useFetch } from '#common/helpers'
import { paginated } from '#common/models'
import { RawSongModel, SongModel } from '#modules/songs/models'
import { createSongPayload } from '#modules/songs/song.helper'
import type { SearchQuery } from '#modules/search/models'

export class SearchSongsUseCase extends useCase(paginated(SongModel)) {
  async execute({ query, page, limit }: z.infer<typeof SearchQuery>) {
    const data = await useFetch({
      endpoint: Endpoints.search.songs,
      params: { q: query, p: page - 1, n: limit },
      schema: z.object({
        total: z.number(),
        start: z.number(),
        results: z.array(RawSongModel)
      })
    })

    return toPage(data.results.map(createSongPayload), { page, limit, total: data.total })
  }
}

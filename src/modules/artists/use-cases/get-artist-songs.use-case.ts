import { z } from 'zod'
import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { toPage, useFetch } from '#common/helpers'
import { paginated } from '#common/models'
import { RawSongModel, SongModel } from '#modules/songs/models'
import { toSong } from '#modules/songs/song.helper'

export interface GetArtistSongsArgs {
  artistId: string
  page: number
  sortBy: 'popularity' | 'latest' | 'alphabetical'
  sortOrder: 'asc' | 'desc'
}

export class GetArtistSongsUseCase extends useCase(paginated(SongModel)) {
  async execute({ artistId, page, sortOrder, sortBy }: GetArtistSongsArgs) {
    const data = await useFetch({
      endpoint: Endpoints.artists.songs,
      params: { artistId, page: page - 1, sort_order: sortOrder, category: sortBy },
      schema: z.object({
        artistId: z.string(),
        name: z.string(),
        subtitle: z.string().optional(),
        image: z.string(),
        follower_count: z.string(),
        type: z.string(),
        isVerified: z.boolean(),
        dominantLanguage: z.string(),
        dominantType: z.string(),
        topSongs: z.object({
          songs: z.array(RawSongModel),
          total: z.number()
        })
      })
    })

    const results = data.topSongs.songs.map(toSong)
    return toPage(results, { page, limit: results.length, total: data.topSongs.total })
  }
}

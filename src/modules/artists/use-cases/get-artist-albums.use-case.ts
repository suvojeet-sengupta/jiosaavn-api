import { z } from 'zod'
import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { toPage, useFetch } from '#common/helpers'
import { paginated } from '#common/models'
import { toAlbum } from '#modules/albums/album.helper'
import { AlbumModel, RawAlbumModel } from '#modules/albums/album.model'

export interface GetArtistAlbumsArgs {
  artistId: string
  page: number
  sortBy: 'popularity' | 'latest' | 'alphabetical'
  sortOrder: 'asc' | 'desc'
}

export class GetArtistAlbumsUseCase extends useCase(paginated(AlbumModel)) {
  async execute(args: GetArtistAlbumsArgs) {
    const { artistId, page, sortBy, sortOrder } = args

    const data = await useFetch({
      endpoint: Endpoints.artists.albums,
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
        topAlbums: z.object({
          albums: z.array(RawAlbumModel),
          total: z.number()
        })
      })
    })

    const results = data.topAlbums.albums.map(toAlbum)
    return toPage(results, { page, limit: results.length, total: data.topAlbums.total })
  }
}

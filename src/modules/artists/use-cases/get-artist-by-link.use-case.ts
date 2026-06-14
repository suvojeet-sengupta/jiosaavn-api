import { z } from 'zod'
import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { assertFound, useFetch } from '#common/helpers'
import { toArtist } from '#modules/artists/artist.helper'
import { ArtistModel, RawArtistModel } from '#modules/artists/models'

export interface GetArtistByLinkArgs {
  token: string
  page: number
  songCount: number
  albumCount: number
  sortBy: 'popularity' | 'latest' | 'alphabetical'
  sortOrder: 'asc' | 'desc'
}

export class GetArtistByLinkUseCase extends useCase(ArtistModel) {
  async execute({ token, page, songCount, albumCount, sortBy, sortOrder }: GetArtistByLinkArgs) {
    const data = await useFetch({
      endpoint: Endpoints.artists.link,
      params: {
        token,
        n_song: songCount,
        n_album: albumCount,
        page,
        sort_order: sortOrder,
        category: sortBy,
        type: 'artist'
      },
      schema: z.union([RawArtistModel, z.array(RawArtistModel)])
    })

    const entity = Array.isArray(data) ? data[0] : data

    return toArtist(assertFound(entity, 'name', 'artist not found'))
  }
}

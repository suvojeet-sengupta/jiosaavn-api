import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { assertFound, useFetch } from '#common/helpers'
import { toArtist } from '#modules/artists/artist.helper'
import { ArtistModel, RawArtistModel } from '#modules/artists/models'

export interface GetArtistByIdArgs {
  artistId: string
  page: number
  songCount: number
  albumCount: number
  sortBy: 'popularity' | 'latest' | 'alphabetical'
  sortOrder: 'asc' | 'desc'
}

export class GetArtistByIdUseCase extends useCase(ArtistModel) {
  async execute({ artistId, page, songCount, albumCount, sortBy, sortOrder }: GetArtistByIdArgs) {
    const data = await useFetch({
      endpoint: Endpoints.artists.id,
      params: {
        artistId,
        n_song: songCount,
        n_album: albumCount,
        page,
        sort_order: sortOrder,
        category: sortBy
      },
      schema: RawArtistModel
    })

    return toArtist(assertFound(data, 'name', 'artist not found'))
  }
}

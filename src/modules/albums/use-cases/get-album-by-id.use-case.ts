import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { assertFound, useFetch } from '#common/helpers'
import { toAlbum } from '#modules/albums/album.helper'
import { AlbumModel, RawAlbumModel } from '#modules/albums/album.model'

export class GetAlbumByIdUseCase extends useCase(AlbumModel) {
  async execute(id: string) {
    const data = await useFetch({
      endpoint: Endpoints.albums.id,
      params: { albumid: id },
      schema: RawAlbumModel
    })

    return toAlbum(assertFound(data, 'title', 'album not found'))
  }
}

import { HTTPException } from 'hono/http-exception'
import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { useFetch } from '#common/helpers'
import { toAlbum } from '#modules/albums/album.helper'
import { AlbumModel, RawAlbumModel } from '#modules/albums/album.model'

export class GetAlbumByIdUseCase extends useCase(AlbumModel) {
  async execute(id: string) {
    const data = await useFetch({
      endpoint: Endpoints.albums.id,
      params: { albumid: id },
      schema: RawAlbumModel
    })

    if (!data) throw new HTTPException(404, { message: 'album not found' })

    return toAlbum(data)
  }
}

import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { useFetch } from '#common/helpers'
import { toAlbum } from '#modules/albums/album.helper'
import { AlbumModel, RawAlbumModel } from '#modules/albums/album.model'

export class GetAlbumByLinkUseCase extends useCase(AlbumModel) {
  async execute(token: string) {
    const data = await useFetch({
      endpoint: Endpoints.albums.link,
      params: {
        token,
        type: 'album'
      },
      schema: z.union([RawAlbumModel, z.array(RawAlbumModel)])
    })

    const entity = Array.isArray(data) ? data[0] : data

    if (!entity) throw new HTTPException(404, { message: 'album not found' })

    return toAlbum(entity)
  }
}

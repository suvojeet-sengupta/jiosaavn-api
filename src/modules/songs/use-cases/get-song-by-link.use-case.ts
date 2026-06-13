import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { useFetch } from '#common/helpers'
import { RawSongModel, SongModel } from '#modules/songs/models'
import { toSong } from '#modules/songs/song.helper'

export class GetSongByLinkUseCase extends useCase(z.array(SongModel)) {
  async execute(token: string) {
    const data = await useFetch({
      endpoint: Endpoints.songs.link,
      params: { token, type: 'song' },
      schema: z.union([z.object({ songs: z.array(RawSongModel).optional() }), z.array(RawSongModel)])
    })

    const songs = Array.isArray(data) ? data : (data.songs ?? [])

    if (!songs.length) throw new HTTPException(404, { message: 'song not found' })

    return songs.map((song) => toSong(song))
  }
}

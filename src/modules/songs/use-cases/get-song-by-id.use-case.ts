import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { useFetch } from '#common/helpers'
import { RawSongModel, SongModel } from '#modules/songs/models'
import { toSong } from '#modules/songs/song.helper'

export interface GetSongByIdArgs {
  songIds: string
}

export class GetSongByIdsUseCase extends useCase(z.array(SongModel)) {
  async execute({ songIds }: GetSongByIdArgs) {
    const data = await useFetch({
      endpoint: Endpoints.songs.id,
      params: { pids: songIds },
      schema: z.object({ songs: z.array(RawSongModel).optional() })
    })

    if (!data.songs?.length) throw new HTTPException(404, { message: 'song not found' })

    const songs = data.songs.map((song) => toSong(song))

    return songs
  }
}

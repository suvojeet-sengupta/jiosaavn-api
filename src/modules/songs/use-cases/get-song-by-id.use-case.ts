import { Endpoints } from '#common/constants'
import { useFetch } from '#common/helpers'
import { createSongPayload } from '#modules/songs/song.helper'
import { HTTPException } from 'hono/http-exception'
import type { IUseCase } from '#common/types'
import type { SongAPIResponseModel, SongModel } from '#modules/songs/models'
import type { z } from 'zod'

export interface GetSongByIdArgs {
  songIds: string
}

export class GetSongByIdUseCase implements IUseCase<GetSongByIdArgs, z.infer<typeof SongModel>[]> {
  constructor() {}

  async execute({ songIds }: GetSongByIdArgs) {
    const { data } = await useFetch<{ songs: z.infer<typeof SongAPIResponseModel>[] }>({
      endpoint: Endpoints.songs.id,
      params: {
        pids: songIds
      }
    })

    if (!data.songs?.length) throw new HTTPException(404, { message: 'song not found' })

    const songs = data.songs.map((song) => createSongPayload(song))

    return songs
  }
}

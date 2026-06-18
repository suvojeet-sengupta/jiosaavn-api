import { Endpoints } from '#common/constants'
import { useFetch } from '#common/helpers'
import { HTTPException } from 'hono/http-exception'
import type { IUseCase } from '#common/types'
import type { LyricsAPIResponseModel, LyricsModel } from '#modules/songs/models'
import type { z } from 'zod'

export class GetSongLyricsUseCase implements IUseCase<string, z.infer<typeof LyricsModel>> {
  constructor() {}

  async execute(lyricsId: string) {
    const { data } = await useFetch<z.infer<typeof LyricsAPIResponseModel>>({
      endpoint: Endpoints.songs.lyrics,
      params: {
        lyrics_id: lyricsId
      }
    })

    if (!data.lyrics) throw new HTTPException(404, { message: 'lyrics not found' })

    return {
      lyrics: data.lyrics,
      copyright: data.lyrics_copyright || null,
      snippet: data.snippet || null
    }
  }
}

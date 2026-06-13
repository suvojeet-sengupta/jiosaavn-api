import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { ApiContextEnum } from '#common/enums'
import { useFetch } from '#common/helpers'
import { RawSongModel, SongModel } from '#modules/songs/models'
import { toSong } from '#modules/songs/song.helper'
import { CreateSongStationUseCase } from '#modules/songs/use-cases'

export interface GetSongSuggestionsArgs {
  songId: string
  limit: number
}

export class GetSongSuggestionsUseCase extends useCase(z.array(SongModel)) {
  private readonly createSongStation = new CreateSongStationUseCase()

  async execute({ songId, limit }: GetSongSuggestionsArgs) {
    const stationId = await this.createSongStation.execute(songId)

    const data = await useFetch({
      endpoint: Endpoints.songs.suggestions,
      params: {
        stationid: stationId,
        k: limit
      },
      context: ApiContextEnum.ANDROID,
      schema: z.object({ stationid: z.string() }).and(z.record(z.string(), z.object({ song: RawSongModel })))
    })

    if (!data) {
      throw new HTTPException(404, { message: `no suggestions found for the given song` })
    }

    const { stationid, ...suggestions } = data

    return (
      Object.values(suggestions)
        .map((element) => element && toSong(element.song))
        .filter(Boolean)
        .slice(0, limit) || []
    )
  }
}

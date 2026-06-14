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
      params: { stationid: stationId, k: limit },
      context: ApiContextEnum.ANDROID,
      schema: z
        .object({ stationid: z.string(), song: RawSongModel.optional() })
        .catchall(z.object({ song: RawSongModel }))
    })

    // `k=1` returns a single suggestion directly under `song`; `k>=2` returns index-keyed `{ song }` entries.
    const { stationid, song, ...indexed } = data
    const rawSongs = song ? [song] : Object.values(indexed).map(({ song }) => song)

    return rawSongs
      .filter(Boolean)
      .map((rawSong) => toSong(rawSong))
      .slice(0, limit)
  }
}

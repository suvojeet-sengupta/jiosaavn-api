import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { ApiContextEnum } from '#common/enums'
import { useFetch } from '#common/helpers'

export class CreateSongStationUseCase extends useCase(z.string()) {
  async execute(songId: string) {
    const encodedSongId = JSON.stringify([encodeURIComponent(songId)])

    const data = await useFetch<{ stationid: string }>({
      endpoint: Endpoints.songs.station,
      params: {
        entity_id: encodedSongId,
        entity_type: 'queue'
      },
      context: ApiContextEnum.ANDROID
    })

    if (!data.stationid) throw new HTTPException(500, { message: 'could not create station' })

    return data.stationid
  }
}

import { z } from 'zod'
import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { assertFound, useFetch } from '#common/helpers'
import { toPlaylist } from '#modules/playlists/playlist.helper'
import { PlaylistModel, RawPlaylistModel } from '#modules/playlists/playlist.model'

export interface GetPlaylistByLinkArgs {
  token: string
  limit: number
  page: number
}

export class GetPlaylistByLinkUseCase extends useCase(PlaylistModel) {
  async execute({ token, limit, page }: GetPlaylistByLinkArgs) {
    const data = await useFetch({
      endpoint: Endpoints.playlists.link,
      params: {
        token,
        n: limit,
        p: page,
        type: 'playlist'
      },
      schema: z.union([RawPlaylistModel, z.array(RawPlaylistModel)])
    })

    const entity = Array.isArray(data) ? data[0] : data
    const playlist = toPlaylist(assertFound(entity, 'title', 'playlist not found'))

    return {
      ...playlist,
      songCount: playlist.songs.length || null,
      songs: playlist.songs.slice(0, limit)
    }
  }
}

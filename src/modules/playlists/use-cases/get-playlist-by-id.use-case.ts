import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { assertFound, useFetch } from '#common/helpers'
import { toPlaylist } from '#modules/playlists/playlist.helper'
import { PlaylistModel, RawPlaylistModel } from '#modules/playlists/playlist.model'

export interface GetPlaylistByIdArgs {
  id: string
  limit: number
  page: number
}

export class GetPlaylistByIdUseCase extends useCase(PlaylistModel) {
  async execute({ id, limit, page }: GetPlaylistByIdArgs) {
    const data = await useFetch({
      endpoint: Endpoints.playlists.id,
      params: {
        listid: id,
        n: limit,
        p: page
      },
      schema: RawPlaylistModel
    })

    const playlist = toPlaylist(assertFound(data, 'title', 'playlist not found'))
    return {
      ...playlist,
      songCount: playlist.songs.length || null,
      songs: playlist.songs.slice(0, limit)
    }
  }
}

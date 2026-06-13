import { createImageLinks } from '#common/helpers'
import { toBoolean, toList, toNumber, toText } from '#common/utils'
import { toArtistMap } from '#modules/artists/artist.helper'
import { toSong } from '#modules/songs/song.helper'
import type { PlaylistModel, RawPlaylistModel } from '#modules/playlists/playlist.model'
import type { z } from 'zod'

export const toPlaylist = (playlist: z.infer<typeof RawPlaylistModel>): z.infer<typeof PlaylistModel> => ({
  id: playlist.id,
  name: playlist.title,
  subtitle: toText(playlist.subtitle),
  description: toText(playlist.header_desc),
  subtitleDescriptions: playlist.subtitle_desc ?? [],
  type: playlist.type,
  year: toNumber(playlist.year),
  playCount: toNumber(playlist.play_count),
  language: playlist.language,
  explicitContent: toBoolean(playlist.explicit_content),
  isDolbyContent: playlist.more_info?.is_dolby_content ?? null,
  url: playlist.perma_url,
  songCount: toNumber(playlist.list_count),
  followerCount: toNumber(playlist.more_info?.follower_count),
  fanCount: toNumber(playlist.more_info?.fan_count?.replaceAll(',', '')),
  videoCount: toNumber(playlist.more_info?.video_count),
  lastUpdated: toText(playlist.more_info?.last_updated),
  owner: {
    id: toText(playlist.more_info?.uid),
    name: toText([playlist.more_info?.firstname, playlist.more_info?.lastname].filter(Boolean).join(' ')),
    username: toText(playlist.more_info?.username)
  },
  artists: toList(playlist.more_info?.artists, toArtistMap),
  image: createImageLinks(playlist.image),
  songs: toList(playlist.list, toSong)
})

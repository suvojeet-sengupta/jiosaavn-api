import { createImageLinks } from '#common/helpers'
import { toBoolean, toList, toNumber, toText } from '#common/utils'
import { toArtistMap } from '#modules/artists/artist.helper'
import { toSong } from '#modules/songs/song.helper'
import type { AlbumModel, RawAlbumModel } from '#modules/albums/album.model'
import type { z } from 'zod'

export const toAlbum = (album: z.infer<typeof RawAlbumModel>): z.infer<typeof AlbumModel> => ({
  id: album.id,
  name: album.title,
  subtitle: toText(album.subtitle),
  description: toText(album.header_desc),
  type: album.type,
  year: toNumber(album.year),
  releaseDate: toText(album.more_info?.release_date),
  playCount: toNumber(album.play_count),
  language: album.language,
  explicitContent: toBoolean(album.explicit_content),
  isDolbyContent: album.more_info?.is_dolby_content ?? null,
  url: album.perma_url,
  labelUrl: toText(album.more_info?.label_url),
  copyright: toText(album.more_info?.copyright_text),
  songCount: toNumber(album.more_info?.song_count),
  artists: {
    primary: toList(album.more_info?.artistMap?.primary_artists, toArtistMap),
    featured: toList(album.more_info?.artistMap?.featured_artists, toArtistMap),
    all: toList(album.more_info?.artistMap?.artists, toArtistMap)
  },
  image: createImageLinks(album.image),
  songs: toList(album.list, toSong)
})

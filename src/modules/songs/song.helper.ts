import { createDownloadLinks, createImageLinks } from '#common/helpers'
import { toBoolean, toList, toNumber, toText } from '#common/utils'
import { toArtistMap } from '#modules/artists/artist.helper'
import type { RawSongModel, SongModel } from '#modules/songs/models'
import type { z } from 'zod'

export const toSong = (song: z.infer<typeof RawSongModel>): z.infer<typeof SongModel> => ({
  id: song.id,
  name: song.title,
  subtitle: toText(song.subtitle),
  type: song.type,
  year: toNumber(song.year),
  releaseDate: toText(song.more_info?.release_date),
  duration: toNumber(song.more_info?.duration),
  label: toText(song.more_info?.label),
  labelUrl: toText(song.more_info?.label_url),
  explicitContent: toBoolean(song.explicit_content),
  isDolbyContent: song.more_info?.is_dolby_content ?? null,
  has320kbps: toBoolean(song.more_info?.['320kbps']),
  playCount: toNumber(song.play_count),
  language: song.language,
  hasLyrics: toBoolean(song.more_info?.has_lyrics),
  lyricsId: toText(song.more_info?.lyrics_id),
  lyricsSnippet: toText(song.more_info?.lyrics_snippet),
  url: song.perma_url,
  copyright: toText(song.more_info?.copyright_text),
  album: {
    id: toText(song.more_info?.album_id),
    name: toText(song.more_info?.album),
    url: toText(song.more_info?.album_url)
  },
  artists: {
    primary: toList(song.more_info?.artistMap?.primary_artists, toArtistMap),
    featured: toList(song.more_info?.artistMap?.featured_artists, toArtistMap),
    all: toList(song.more_info?.artistMap?.artists, toArtistMap)
  },
  image: createImageLinks(song.image),
  downloadUrl: createDownloadLinks(song.more_info?.encrypted_media_url)
})

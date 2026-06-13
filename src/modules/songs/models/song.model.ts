import { z } from 'zod'
import { DownloadLinkModel, ImageLinkModel } from '#common/models'
import { ArtistMapGroupModel, RawArtistMapGroupModel } from '#modules/artists/models'

export const RawSongModel = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().nullish(),
  header_desc: z.string().nullish(),
  type: z.string(),
  perma_url: z.string(),
  image: z.string().nullish(),
  language: z.string(),
  year: z.string().nullish(),
  play_count: z.string().nullish(),
  explicit_content: z.string().nullish(),
  list_count: z.string().nullish(),
  list_type: z.string().nullish(),
  list: z.string().nullish(),
  more_info: z
    .object({
      music: z.string().nullish(),
      album_id: z.string().nullish(),
      album: z.string().nullish(),
      label: z.string().nullish(),
      origin: z.string().nullish(),
      is_dolby_content: z.boolean().nullish(),
      '320kbps': z.string().nullish(),
      encrypted_media_url: z.string().nullish(),
      encrypted_cache_url: z.string().nullish(),
      album_url: z.string().nullish(),
      duration: z.string().nullish(),
      rights: z
        .object({
          code: z.string().nullish(),
          cacheable: z.string().nullish(),
          delete_cached_object: z.string().nullish(),
          reason: z.string().nullish()
        })
        .nullish(),
      cache_state: z.string().nullish(),
      has_lyrics: z.string().nullish(),
      lyrics_snippet: z.string().nullish(),
      starred: z.string().nullish(),
      copyright_text: z.string().nullish(),
      artistMap: RawArtistMapGroupModel.nullish(),
      release_date: z.string().nullish(),
      label_url: z.string().nullish(),
      vcode: z.string().nullish(),
      vlink: z.string().nullish(),
      triller_available: z.boolean().nullish(),
      request_jiotune_flag: z.boolean().nullish(),
      webp: z.string().nullish(),
      lyrics_id: z.string().nullish()
    })
    .nullish()
})

export const SongModel = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  year: z.number().nullable(),
  releaseDate: z.string().nullable(),
  duration: z.number().nullable(),
  label: z.string().nullable(),
  explicitContent: z.boolean(),
  playCount: z.number().nullable(),
  language: z.string(),
  hasLyrics: z.boolean(),
  lyricsId: z.string().nullable(),
  url: z.string(),
  copyright: z.string().nullable(),
  album: z.object({
    id: z.string().nullable(),
    name: z.string().nullable(),
    url: z.string().nullable()
  }),
  artists: ArtistMapGroupModel,
  image: z.array(DownloadLinkModel),
  downloadUrl: z.array(DownloadLinkModel)
})

export const SongSummaryModel = z.object({
  type: z.literal('song'),
  id: z.string(),
  name: z.string(),
  url: z.string(),
  image: z.array(ImageLinkModel),
  album: z.string().nullable(),
  artists: z.string().nullable(),
  language: z.string().nullable(),
  explicitContent: z.boolean()
})

import { z } from 'zod'
import { DownloadLinkModel, ImageLinkModel } from '#common/models'
import { ArtistMapGroupModel, ArtistMapModel, RawArtistMapGroupModel } from '#modules/artists/models/artist-map.model'
import { RawSongModel, SongModel } from '#modules/songs/models'

export const RawAlbumModel = z.object({
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
  list: z.union([z.array(RawSongModel), z.string()]).nullish(),
  more_info: z
    .object({
      artistMap: RawArtistMapGroupModel.nullish(),
      song_count: z.string().nullish(),
      copyright_text: z.string().nullish(),
      is_dolby_content: z.boolean().nullish(),
      label_url: z.string().nullish(),
      release_date: z.string().nullish()
    })
    .nullish()
})

export const AlbumModel = z.object({
  id: z.string(),
  name: z.string(),
  subtitle: z.string().nullable(),
  description: z.string().nullable(),
  year: z.number().nullable(),
  releaseDate: z.string().nullable(),
  type: z.string(),
  playCount: z.number().nullable(),
  language: z.string(),
  explicitContent: z.boolean(),
  isDolbyContent: z.boolean().nullable(),
  artists: ArtistMapGroupModel,
  songCount: z.number().nullable(),
  url: z.string(),
  labelUrl: z.string().nullable(),
  copyright: z.string().nullable(),
  image: z.array(DownloadLinkModel),
  songs: z.array(SongModel)
})

export const AlbumSummaryModel = z.object({
  type: z.literal('album'),
  id: z.string(),
  name: z.string(),
  url: z.string(),
  image: z.array(ImageLinkModel),
  artists: z.array(ArtistMapModel),
  year: z.string().nullable(),
  songCount: z.number().nullable(),
  language: z.string().nullable(),
  explicitContent: z.boolean()
})

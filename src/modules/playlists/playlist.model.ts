import { z } from 'zod'
import { DownloadLinkModel, ImageLinkModel } from '#common/models'
import { ArtistMapModel, RawArtistMapModel } from '#modules/artists/models'
import { RawSongModel, SongModel } from '#modules/songs/models'

export const RawPlaylistModel = z.object({
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
  list: z.array(RawSongModel).nullish(),
  more_info: z
    .object({
      uid: z.string().nullish(),
      is_dolby_content: z.boolean().nullish(),
      subtype: z.array(z.string()).nullish(),
      last_updated: z.string().nullish(),
      username: z.string().nullish(),
      firstname: z.string().nullish(),
      lastname: z.string().nullish(),
      is_followed: z.string().nullish(),
      isFY: z.boolean().nullish(),
      follower_count: z.string().nullish(),
      fan_count: z.string().nullish(),
      playlist_type: z.string().nullish(),
      share: z.string().nullish(),
      sub_types: z.array(z.string()).nullish(),
      images: z.array(z.string()).nullish(),
      H2: z.string().nullish(),
      subheading: z.string().nullish(),
      video_count: z.string().nullish(),
      artists: z.array(RawArtistMapModel).nullish()
    })
    .nullish()
})

export const PlaylistModel = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  year: z.number().nullable(),
  type: z.string(),
  playCount: z.number().nullable(),
  language: z.string(),
  explicitContent: z.boolean(),
  songCount: z.number().nullable(),
  url: z.string(),
  followerCount: z.number().nullable(),
  lastUpdated: z.string().nullable(),
  owner: z
    .object({ id: z.string().nullable(), name: z.string().nullable(), username: z.string().nullable() })
    .nullable(),
  image: z.array(DownloadLinkModel),
  songs: z.array(SongModel),
  artists: z.array(ArtistMapModel)
})

export const PlaylistSummaryModel = z.object({
  type: z.literal('playlist'),
  id: z.string(),
  name: z.string(),
  url: z.string(),
  image: z.array(ImageLinkModel),
  songCount: z.number().nullable(),
  followerCount: z.number().nullable(),
  language: z.string().nullable(),
  explicitContent: z.boolean()
})

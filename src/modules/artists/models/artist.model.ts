import { z } from 'zod'
import { DownloadLinkModel, ImageLinkModel } from '#common/models'
import { AlbumModel, RawAlbumModel } from '#modules/albums/album.model'
import { RawSongModel, SongModel } from '#modules/songs/models'

export const RawArtistModel = z.object({
  artistId: z.string().nullish(),
  id: z.string().nullish(),
  name: z.string(),
  perma_url: z.string().nullish(),
  image: z.string().nullish(),
  follower_count: z.string().nullish(),
  type: z.string(),
  isVerified: z.boolean().nullish(),
  dominantLanguage: z.string().nullish(),
  dominantType: z.string().nullish(),
  topSongs: z.array(RawSongModel).nullish(),
  topAlbums: z.array(RawAlbumModel).nullish(),
  singles: z.array(RawSongModel).nullish(),
  latest_release: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        type: z.string(),
        perma_url: z.string(),
        image: z.string().nullish()
      })
    )
    .nullish(),
  similarArtists: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        perma_url: z.string(),
        image_url: z.string().nullish(),
        type: z.string()
      })
    )
    .nullish(),
  isRadioPresent: z.boolean().nullish(),
  bio: z.string().nullish(),
  dob: z.string().nullish(),
  fb: z.string().nullish(),
  twitter: z.string().nullish(),
  wiki: z.string().nullish(),
  urls: z
    .object({
      albums: z.string().nullish(),
      bio: z.string().nullish(),
      comments: z.string().nullish(),
      songs: z.string().nullish(),
      overview: z.string().nullish()
    })
    .nullish(),
  availableLanguages: z.array(z.string()).nullish(),
  fan_count: z.string().nullish()
})

export const ArtistModel = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  type: z.string(),
  image: z.array(DownloadLinkModel),
  followerCount: z.number().nullable(),
  fanCount: z.number().nullable(),
  isVerified: z.boolean().nullable(),
  dominantLanguage: z.string().nullable(),
  dominantType: z.string().nullable(),
  bio: z
    .array(
      z.object({
        text: z.string().nullable(),
        title: z.string().nullable(),
        sequence: z.number().nullable()
      })
    )
    .nullable(),
  dob: z.string().nullable(),
  fb: z.string().nullable(),
  twitter: z.string().nullable(),
  wiki: z.string().nullable(),
  availableLanguages: z.array(z.string()),
  isRadioPresent: z.boolean().nullable(),
  topSongs: z.array(SongModel),
  topAlbums: z.array(AlbumModel),
  singles: z.array(SongModel),
  latestRelease: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      url: z.string(),
      image: z.array(DownloadLinkModel)
    })
  ),
  similarArtists: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      url: z.string(),
      image: z.array(DownloadLinkModel),
      type: z.string()
    })
  )
})

export const ArtistSummaryModel = z.object({
  type: z.literal('artist'),
  id: z.string(),
  name: z.string(),
  url: z.string(),
  image: z.array(ImageLinkModel),
  role: z.string().nullable()
})

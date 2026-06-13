import { createImageLinks } from '#common/helpers'
import { safeJsonParse, toBoolean, toList, toNumber, toText } from '#common/utils'
import { toAlbum } from '#modules/albums/album.helper'
import { toSong } from '#modules/songs/song.helper'
import type {
  ArtistMapModel,
  ArtistModel,
  RawArtistMapGroupModel,
  RawArtistMapModel,
  RawArtistModel,
  RawArtistPlaylistModel,
  RawSimilarArtistModel,
  SimilarArtistModel
} from '#modules/artists/models'
import type { PlaylistSummaryModel } from '#modules/playlists/playlist.model'
import type { z } from 'zod'

const toArtistPlaylist = (playlist: z.infer<typeof RawArtistPlaylistModel>): z.infer<typeof PlaylistSummaryModel> => ({
  type: 'playlist',
  id: playlist.id,
  name: playlist.title,
  url: playlist.perma_url,
  image: createImageLinks(playlist.image),
  songCount: toNumber(playlist.more_info?.song_count),
  followerCount: null,
  language: toText(playlist.more_info?.language),
  explicitContent: toBoolean(playlist.explicit_content)
})

const toSimilarArtist = (similar: z.infer<typeof RawSimilarArtistModel>): z.infer<typeof SimilarArtistModel> => ({
  id: similar.id,
  name: similar.name,
  url: similar.perma_url,
  image: createImageLinks(similar.image_url),
  type: similar.type,
  isVerified: toBoolean(similar.isVerified),
  dominantType: toText(similar.dominantType),
  dob: toText(similar.dob),
  fb: toText(similar.fb),
  twitter: toText(similar.twitter),
  wiki: toText(similar.wiki),
  languages: Object.keys(safeJsonParse<Record<string, string>>(similar.languages) ?? {}),
  isRadioPresent: similar.isRadioPresent ?? null
})

export const toArtist = (artist: z.infer<typeof RawArtistModel>): z.infer<typeof ArtistModel> => ({
  id: artist.artistId || artist.id || '',
  name: artist.name,
  subtitle: toText(artist.subtitle),
  url: artist.urls?.overview || artist.perma_url || '',
  type: artist.type,
  followerCount: toNumber(artist.follower_count),
  fanCount: toNumber(artist.fan_count),
  isVerified: artist.isVerified || null,
  dominantLanguage: toText(artist.dominantLanguage),
  dominantType: toText(artist.dominantType),
  bio: safeJsonParse(artist.bio),
  dob: toText(artist.dob),
  fb: toText(artist.fb),
  twitter: toText(artist.twitter),
  wiki: toText(artist.wiki),
  availableLanguages: artist.availableLanguages ?? [],
  isRadioPresent: artist.isRadioPresent || null,
  image: createImageLinks(artist.image),
  topSongs: toList(artist.topSongs, toSong),
  topAlbums: toList(artist.topAlbums, toAlbum),
  singles: toList(artist.singles, toAlbum),
  dedicatedArtistPlaylists: toList(artist.dedicated_artist_playlist, toArtistPlaylist),
  featuredArtistPlaylists: toList(artist.featured_artist_playlist, toArtistPlaylist),
  latestRelease: toList(artist.latest_release, toAlbum),
  similarArtists: toList(artist.similarArtists, toSimilarArtist)
})

export const toArtistMap = (artist: z.infer<typeof RawArtistMapModel>): z.infer<typeof ArtistMapModel> => ({
  id: artist.id,
  name: artist.name,
  role: artist.role,
  image: createImageLinks(artist.image),
  type: artist.type,
  url: artist.perma_url
})

/** Card artists as objects: from `artistMap` when present (rich sources), else name-only from a joined string (lean sources). */
export const toArtists = (
  group: z.infer<typeof RawArtistMapGroupModel> | unknown[] | null | undefined,
  names?: string | null
): z.infer<typeof ArtistMapModel>[] => {
  // For credit-less items JioSaavn serializes an empty artist map as `[]` instead of `{ primary_artists, … }`.
  const map = group && !Array.isArray(group) ? group : undefined

  const list = map?.primary_artists?.length ? map.primary_artists : map?.artists
  if (list?.length) return list.map(toArtistMap)

  return names
    ? names.split(',').map((name) => ({ id: '', name: name.trim(), role: '', type: '', url: '', image: [] }))
    : []
}

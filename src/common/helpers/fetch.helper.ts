import { userAgents, type Endpoints } from '#common/constants'
import type { ApiContextEnum } from '#common/enums'

type EndpointValue = (typeof Endpoints)[keyof typeof Endpoints]

interface FetchParams {
  endpoint: EndpointValue
  params: Record<string, string | number>
  context?: ApiContextEnum
}

interface FetchResponse<T> {
  data: T
  ok: Response['ok']
}

interface CacheEntry<T> {
  data: T
  expiry: number
}

const cache = new Map<string, CacheEntry<any>>()
let insertCount = 0

const getTTL = (endpoint: string): number => {
  switch (endpoint) {
    case 'lyrics.getLyrics':
      return 12 * 60 * 60 * 1000 // 12 hours for lyrics
    case 'content.getAlbumDetails':
    case 'playlist.getDetails':
    case 'artist.getArtistPageDetails':
    case 'artist.getArtistMoreSong':
    case 'artist.getArtistMoreAlbum':
      return 6 * 60 * 60 * 1000 // 6 hours for albums/playlists/artists
    case 'song.getDetails':
    case 'webapi.get':
    case 'autocomplete.get':
    case 'search.getResults':
    case 'search.getAlbumResults':
    case 'search.getArtistResults':
    case 'search.getPlaylistResults':
      return 30 * 60 * 1000 // 30 minutes for songs/searches/resolutions
    case 'webradio.getSong':
      return 5 * 60 * 1000 // 5 minutes for suggestions
    default:
      return 0 // do not cache other endpoints
  }
}

export const useFetch = async <T>({ endpoint, params, context }: FetchParams): Promise<FetchResponse<T>> => {
  const url = new URL('https://www.jiosaavn.com/api.php')

  url.searchParams.append('__call', endpoint.toString())
  url.searchParams.append('_format', 'json')
  url.searchParams.append('_marker', '0')
  url.searchParams.append('api_version', '4')
  url.searchParams.append('ctx', context || 'web6dot0')

  Object.keys(params).forEach((key) => url.searchParams.append(key, String(params[key])))

  const endpointStr = endpoint.toString()
  const cacheKey = `${endpointStr}:${url.searchParams.toString()}`
  const ttl = getTTL(endpointStr)
  const now = Date.now()

  if (ttl > 0) {
    const cached = cache.get(cacheKey)
    if (cached) {
      if (now < cached.expiry) {
        return { data: cached.data as T, ok: true }
      } else {
        cache.delete(cacheKey)
      }
    }
  }

  // Periodic lazy cleanup of expired entries
  insertCount++
  if (insertCount >= 100) {
    insertCount = 0
    for (const [k, v] of cache.entries()) {
      if (now > v.expiry) {
        cache.delete(k)
      }
    }
  }

  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)]

  const response = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json', 'User-Agent': randomUserAgent }
  })

  const data = await response.json()

  if (response.ok && ttl > 0) {
    cache.set(cacheKey, { data, expiry: now + ttl })
  }

  return { data: data as T, ok: response.ok }
}


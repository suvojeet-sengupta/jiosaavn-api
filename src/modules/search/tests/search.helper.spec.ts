import { describe, expect, it } from 'vitest'
import { toSearchResult } from '#modules/search/search.helper'

// Exercises every `topQueryToCard` branch (song / album / artist / playlist + unsupported → dropped).
const data = {
  topquery: {
    data: [
      {
        id: 's',
        title: 'Song',
        type: 'song',
        image: '',
        more_info: { album: 'Al', primary_artists: 'PA', language: 'hindi' },
        explicit_content: '0'
      },
      { id: 'a', title: 'Album', type: 'album', image: '', more_info: { language: 'hindi' }, explicit_content: '0' },
      { id: 'ar', title: 'Artist', type: 'artist', image: '' },
      {
        id: 'p',
        title: 'Playlist',
        type: 'playlist',
        image: '',
        more_info: { language: 'hindi' },
        explicit_content: '0'
      },
      { id: 'u', title: 'Unknown', type: 'unknown', image: '' }
    ],
    position: 0
  },
  songs: { data: [], position: 1 },
  albums: { data: [], position: 2 },
  artists: { data: [], position: 3 },
  playlists: { data: [], position: 4 }
}

describe('toSearchResult', () => {
  it('maps each top-query type to a card and drops unsupported types', () => {
    const result = toSearchResult(data as unknown as Parameters<typeof toSearchResult>[0])

    expect(result.topQuery).toHaveLength(4)
    expect(result.topQuery.map((card) => card.type)).toEqual(['song', 'album', 'artist', 'playlist'])
  })
})

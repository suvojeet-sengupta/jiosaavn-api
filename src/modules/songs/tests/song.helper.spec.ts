import { describe, expect, it } from 'vitest'
import { toSong } from '#modules/songs/song.helper'

// A song with no `more_info`/`image`/`encrypted_media_url` exercises every null/empty fallback arm.
const minimalRawSong = { id: 's', title: 'Song', type: 'song', language: 'hindi', perma_url: 'https://x' }

describe('toSong', () => {
  it('applies null/empty fallbacks when optional fields are absent', () => {
    const song = toSong(minimalRawSong as unknown as Parameters<typeof toSong>[0])

    expect(song.isDolbyContent).toBeNull()
    expect(song.image).toEqual([])
    expect(song.downloadUrl).toEqual([])
    expect(song.artists).toEqual({ primary: [], featured: [], all: [] })
  })
})

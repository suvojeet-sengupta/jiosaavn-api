import { describe, expect, it } from 'vitest'
import { toArtist } from '#modules/artists/artist.helper'

// No ids/urls/languages, plus a credit-less similar artist, exercises every fallback arm in
// `toArtist` and `toSimilarArtist` (id `|| ''`, url `|| ''`, `?? []`, `|| null`, languages `?? {}`).
const minimalRawArtist = {
  name: 'Artist',
  type: 'artist',
  similarArtists: [{ id: 'sa', name: 'Similar', perma_url: 'https://x', image_url: '', type: 'artist' }]
}

describe('toArtist', () => {
  it('applies fallbacks and maps a credit-less similar artist', () => {
    const artist = toArtist(minimalRawArtist as unknown as Parameters<typeof toArtist>[0])

    expect(artist.id).toBe('')
    expect(artist.url).toBe('')
    expect(artist.isVerified).toBeNull()
    expect(artist.availableLanguages).toEqual([])
    expect(artist.isRadioPresent).toBeNull()
    expect(artist.similarArtists[0]?.languages).toEqual([])
    expect(artist.similarArtists[0]?.isRadioPresent).toBeNull()
  })
})

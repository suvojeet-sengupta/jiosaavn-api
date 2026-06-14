import { describe, expect, it } from 'vitest'
import { toCard, toCards, toModules } from '#modules/browse/browse.helper'

const feedItem = (type: string) => ({ id: 'id', title: 'title', type, image: '', perma_url: '' })

describe('toCard / toCards', () => {
  it('returns null for an unsupported type', () => {
    expect(toCard(feedItem('unknown'))).toBeNull()
  })

  it('toCards maps known types and drops unsupported ones', () => {
    const cards = toCards([feedItem('song'), feedItem('unknown'), feedItem('radio_station')])
    expect(cards).toHaveLength(2)
  })
})

describe('toModules', () => {
  it('returns empty collections when the launch payload is empty', () => {
    const modules = toModules({} as unknown as Parameters<typeof toModules>[0])

    expect(modules).toEqual({
      trending: [],
      albums: [],
      playlists: [],
      charts: [],
      radioStations: [],
      artistRecommendations: []
    })
  })
})

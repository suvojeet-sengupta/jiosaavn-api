import { describe, expect, it } from 'vitest'
import { toPlaylist } from '#modules/playlists/playlist.helper'

// A playlist with no `more_info`/`list`/`subtitle_desc` exercises the null/empty fallback arms.
const minimalRawPlaylist = { id: 'p', title: 'Playlist', type: 'playlist', language: 'hindi', perma_url: 'https://x' }

describe('toPlaylist', () => {
  it('applies fallbacks when more_info and lists are absent', () => {
    const playlist = toPlaylist(minimalRawPlaylist as unknown as Parameters<typeof toPlaylist>[0])

    expect(playlist.isDolbyContent).toBeNull()
    expect(playlist.subtitleDescriptions).toEqual([])
    expect(playlist.songs).toEqual([])
    expect(playlist.owner?.id).toBeNull()
  })
})

import { HTTPException } from 'hono/http-exception'
import { beforeAll, describe, expect, it } from 'vitest'
import { PlaylistModel } from '#modules/playlists/playlist.model'
import { GetPlaylistByLinkUseCase } from '#modules/playlists/use-cases'

describe('GetPlaylistByLink', () => {
  let getPlaylistByLinkUseCase: GetPlaylistByLinkUseCase

  beforeAll(() => {
    getPlaylistByLinkUseCase = new GetPlaylistByLinkUseCase()
  })

  it('should get playlist by link', async () => {
    const playlist = await getPlaylistByLinkUseCase.execute({
      token: 'AMoxtXyKHoU_',
      page: 1,
      limit: 5
    })

    expect(() => PlaylistModel.parse(playlist)).not.toThrow()
  })

  it('should throw 404 for an unknown playlist token', async () => {
    await expect(getPlaylistByLinkUseCase.execute({ token: 'random-no-token', page: 1, limit: 5 })).rejects.toThrow(
      HTTPException
    )
  })
})

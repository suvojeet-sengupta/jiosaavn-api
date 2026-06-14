import { HTTPException } from 'hono/http-exception'
import { beforeAll, describe, expect, it } from 'vitest'
import { PlaylistModel } from '#modules/playlists/playlist.model'
import { GetPlaylistByIdUseCase } from '#modules/playlists/use-cases'

describe('GetPlaylistById', () => {
  let getPlaylistByIdUseCase: GetPlaylistByIdUseCase

  beforeAll(() => {
    getPlaylistByIdUseCase = new GetPlaylistByIdUseCase()
  })

  it('should get playlist by id', async () => {
    const playlist = await getPlaylistByIdUseCase.execute({
      id: '159470188',
      page: 1,
      limit: 5
    })

    expect(() => PlaylistModel.parse(playlist)).not.toThrow()
  })

  it('should throw 404 for an unknown playlist id', async () => {
    await expect(getPlaylistByIdUseCase.execute({ id: 'random-no-id', page: 1, limit: 5 })).rejects.toThrow(
      HTTPException
    )
  })

  // Regression: a numeric-but-nonexistent listid is echoed back into `id`, so an id-based guard would
  // wrongly pass it through. The title is the field JioSaavn reliably leaves empty.
  it('should throw 404 for a numeric-but-nonexistent playlist id', async () => {
    await expect(getPlaylistByIdUseCase.execute({ id: '99999999999', page: 1, limit: 5 })).rejects.toThrow(
      HTTPException
    )
  })
})

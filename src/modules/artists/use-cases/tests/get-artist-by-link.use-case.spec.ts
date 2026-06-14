import { HTTPException } from 'hono/http-exception'
import { beforeAll, describe, expect, it } from 'vitest'
import { ArtistModel } from '#modules/artists/models'
import { GetArtistByLinkUseCase } from '#modules/artists/use-cases'

describe('GetArtistByLink', () => {
  let getArtistByLinkUseCase: GetArtistByLinkUseCase

  beforeAll(() => {
    getArtistByLinkUseCase = new GetArtistByLinkUseCase()
  })

  it('should get artist by link and return an artist', async () => {
    const artist = await getArtistByLinkUseCase.execute({
      token: 'bQVPhRbZO1I_',
      page: 1,
      songCount: 5,
      albumCount: 5,
      sortBy: 'popularity',
      sortOrder: 'asc'
    })

    expect(() => ArtistModel.parse(artist)).not.toThrow()
  })

  it('should throw 404 for an unknown artist token', async () => {
    await expect(
      getArtistByLinkUseCase.execute({
        token: 'random-no-token',
        page: 1,
        songCount: 5,
        albumCount: 5,
        sortBy: 'popularity',
        sortOrder: 'asc'
      })
    ).rejects.toThrow(HTTPException)
  })
})

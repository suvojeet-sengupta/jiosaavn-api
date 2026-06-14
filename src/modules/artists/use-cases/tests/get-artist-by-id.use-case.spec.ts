import { HTTPException } from 'hono/http-exception'
import { beforeAll, describe, expect, it } from 'vitest'
import { ArtistModel } from '#modules/artists/models'
import { GetArtistByIdUseCase } from '#modules/artists/use-cases'

describe('GetArtistById', () => {
  let getArtistByIdUseCase: GetArtistByIdUseCase

  beforeAll(() => {
    getArtistByIdUseCase = new GetArtistByIdUseCase()
  })

  it('should get artist by id and return an artist', async () => {
    const artist = await getArtistByIdUseCase.execute({
      artistId: '1274170',
      page: 1,
      songCount: 5,
      albumCount: 5,
      sortBy: 'popularity',
      sortOrder: 'desc'
    })

    expect(() => ArtistModel.parse(artist)).not.toThrow()
  })

  it('should throw 404 for an unknown artist id', async () => {
    await expect(
      getArtistByIdUseCase.execute({
        artistId: 'random-no-id',
        page: 1,
        songCount: 5,
        albumCount: 5,
        sortBy: 'popularity',
        sortOrder: 'desc'
      })
    ).rejects.toThrow(HTTPException)
  })
})

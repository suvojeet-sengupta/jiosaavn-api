import { HTTPException } from 'hono/http-exception'
import { beforeAll, describe, expect, it } from 'vitest'
import { AlbumModel } from '#modules/albums/album.model'
import { GetAlbumByIdUseCase } from '#modules/albums/use-cases'

describe('GetAlbumById', () => {
  let getAlbumByIdUseCase: GetAlbumByIdUseCase

  beforeAll(() => {
    getAlbumByIdUseCase = new GetAlbumByIdUseCase()
  })

  it('should get album by id', async () => {
    const album = await getAlbumByIdUseCase.execute('23241654')

    expect(() => AlbumModel.parse(album)).not.toThrow()
  })

  it('should throw 404 for an unknown album id', async () => {
    await expect(getAlbumByIdUseCase.execute('random-no-id')).rejects.toThrow(HTTPException)
  })
})

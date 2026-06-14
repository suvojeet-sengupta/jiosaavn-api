import { HTTPException } from 'hono/http-exception'
import { beforeAll, describe, expect, it } from 'vitest'
import { AlbumModel } from '#modules/albums/album.model'
import { GetAlbumByLinkUseCase } from '#modules/albums/use-cases'

describe('GetAlbumByLink', () => {
  let getAlbumByLinkUseCase: GetAlbumByLinkUseCase

  beforeAll(() => {
    getAlbumByLinkUseCase = new GetAlbumByLinkUseCase()
  })

  it('should get album by link and return an album', async () => {
    const album = await getAlbumByLinkUseCase.execute('ITIyo-GDr7A_')

    expect(() => AlbumModel.parse(album)).not.toThrow()
  })

  it('should throw 404 for an unknown album token', async () => {
    await expect(getAlbumByLinkUseCase.execute('random-no-token')).rejects.toThrow(HTTPException)
  })
})

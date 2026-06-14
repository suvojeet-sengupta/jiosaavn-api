import { beforeAll, describe, expect, it } from 'vitest'
import { SongController } from '#modules/index'
import { SongModel } from '#modules/songs/models'
import type { z } from 'zod'

describe('SongController', () => {
  let controller: SongController

  beforeAll(() => {
    controller = new SongController()
  })

  it('get songs by ids', async () => {
    const response = await controller.controller.request('/songs?ids=3IoDK8qI')
    const data = (await response.json()) as z.infer<typeof SongModel>[]
    expect(() => SongModel.parse(data[0])).not.toThrow()
  })

  it('get song by id', async () => {
    const response = await controller.controller.request('/songs/3IoDK8qI')
    const data = await response.json()
    expect(() => SongModel.parse(data)).not.toThrow()
  })

  it('get song suggestions', async () => {
    const response = await controller.controller.request('/songs/3IoDK8qI/suggestions?limit=2')
    const data = (await response.json()) as z.infer<typeof SongModel>[]
    expect(() => SongModel.parse(data[0])).not.toThrow()
  })
})

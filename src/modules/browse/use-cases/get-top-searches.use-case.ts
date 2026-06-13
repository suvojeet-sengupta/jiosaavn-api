import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { toPage, useFetch } from '#common/helpers'
import { paginated, type PaginationQuery } from '#common/models'
import { toCards } from '#modules/browse/browse.helper'
import { EntityCardModel, FeedListAPIResponseModel } from '#modules/browse/models'
import type { z } from 'zod'

export class GetTopSearchesUseCase extends useCase(paginated(EntityCardModel)) {
  async execute({ page, limit }: z.infer<typeof PaginationQuery>) {
    const data = await useFetch({
      endpoint: Endpoints.browse.topSearches,
      params: {},
      schema: FeedListAPIResponseModel
    })

    const all = toCards(data)
    const start = (page - 1) * limit

    return toPage(all.slice(start, start + limit), { page, limit, total: all.length })
  }
}

import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { useFetch } from '#common/helpers'
import { SearchAPIResponseModel, SearchResultModel } from '#modules/search/models'
import { toSearchResult } from '#modules/search/search.helper'

export class SearchAllUseCase extends useCase(SearchResultModel) {
  async execute(query: string) {
    const data = await useFetch({
      endpoint: Endpoints.search.all,
      params: { query },
      schema: SearchAPIResponseModel
    })

    return toSearchResult(data)
  }
}

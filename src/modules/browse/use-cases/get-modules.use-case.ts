import { useCase } from '#common/classes'
import { Endpoints } from '#common/constants'
import { useFetch } from '#common/helpers'
import { toModules } from '#modules/browse/browse.helper'
import { LaunchDataAPIResponseModel, ModulesModel } from '#modules/browse/models'

export class GetModulesUseCase extends useCase(ModulesModel) {
  async execute() {
    const data = await useFetch({
      endpoint: Endpoints.browse.modules,
      params: {},
      schema: LaunchDataAPIResponseModel
    })

    return toModules(data)
  }
}

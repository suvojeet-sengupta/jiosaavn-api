import { BaseUseCaseService } from '#common/classes'
import * as BaseAllUseCases from '#modules/songs/use-cases'

export class SongService extends BaseUseCaseService(BaseAllUseCases) {}

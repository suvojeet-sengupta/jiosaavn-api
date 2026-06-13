import { ErrorModel, paginated } from '#common/models'
import type { z } from 'zod'

export const openApiJsonResponse = <Schema extends z.ZodTypeAny>(
  schema: Schema,
  description = 'Successful response'
) => ({
  200: { description, content: { 'application/json': { schema } } }
})

export const openApiPaginatedResponse = <Schema extends z.ZodTypeAny>(
  item: Schema,
  description = 'Successful response'
) => openApiJsonResponse(paginated(item), description)

export const errorResponses = {
  400: { description: 'Bad request', content: { 'application/json': { schema: ErrorModel } } },
  404: { description: 'Not found', content: { 'application/json': { schema: ErrorModel } } }
}

export const toPage = <T>(
  results: T[],
  args: { page: number; limit: number; total?: number }
): { total: number; page: number; limit: number; results: T[] } => ({
  total: args.total ?? results.length,
  page: args.page,
  limit: args.limit,
  results
})

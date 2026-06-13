import { z } from 'zod'

export const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
})

export const paginated = <ItemSchema extends z.ZodTypeAny>(item: ItemSchema) =>
  z.object({ total: z.number(), page: z.number(), limit: z.number(), results: z.array(item) })

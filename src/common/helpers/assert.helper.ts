import { HTTPException } from 'hono/http-exception'

// JioSaavn answers an unknown id/token with HTTP 200 and an emptied body. Assert on the display
// field (`title`/`name`) — `id` is echoed back on some endpoints, so it can't flag a miss.
export const assertFound = <T extends object>(entity: T | null | undefined, key: keyof T, message: string): T => {
  if (!entity?.[key]) throw new HTTPException(404, { message })

  return entity
}

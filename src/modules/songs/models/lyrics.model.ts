import { z } from 'zod'

export const LyricsAPIResponseModel = z.object({
  lyrics: z.string(),
  lyrics_copyright: z.string().optional(),
  snippet: z.string().optional()
})

export const LyricsModel = z.object({
  lyrics: z.string(),
  copyright: z.string().nullable(),
  snippet: z.string().nullable()
})

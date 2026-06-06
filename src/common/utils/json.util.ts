export const safeJsonParse = <T = unknown>(value: string | null | undefined, fallback: T | null = null): T | null => {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

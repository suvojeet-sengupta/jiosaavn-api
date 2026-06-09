export const toNumber = (value?: string | null): number | null => (value ? Number(value) : null)

export const toBoolean = (value?: string | null): boolean => value === '1' || value === 'true'

export const toText = (value?: string | null): string | null => value || null

export const toList = <T, R>(value: T[] | string | null | undefined, transform: (item: T) => R): R[] =>
  Array.isArray(value) ? value.map(transform) : []

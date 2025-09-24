let counter = 0

export function createId(prefix: string): string {
  counter += 1
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${random}${counter}`
}

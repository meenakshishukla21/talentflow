export async function withLatency<T>(fn: () => Promise<T> | T): Promise<T> {
  const latency = Math.random() * 1000 + 200
  await new Promise((resolve) => setTimeout(resolve, latency))
  return fn()
}

export function shouldFailWrite(): boolean {
  const chance = Math.random()
  return chance < 0.08
}

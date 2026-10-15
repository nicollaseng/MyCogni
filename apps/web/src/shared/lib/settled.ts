export function settledValue<T>(result: PromiseSettledResult<T>): T {
  if (result.status === 'rejected') {
    throw result.reason
  }
  return result.value
}

export async function guarded<G, T>(guard: Promise<G>, work: Promise<T>): Promise<[G, T]> {
  const [checked, done] = await Promise.allSettled([guard, work])
  return [settledValue(checked), settledValue(done)]
}

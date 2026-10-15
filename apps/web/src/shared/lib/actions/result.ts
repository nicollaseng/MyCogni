export type ActionResult<T> = { ok: true; value: T } | { ok: false; error: string }

export function failure(error: string): ActionResult<never> {
  return { ok: false, error }
}

export async function attempt<T>(work: () => Promise<T>, error: string): Promise<ActionResult<T>> {
  try {
    return { ok: true, value: await work() }
  } catch (cause) {
    console.error(cause)
    return failure(error)
  }
}

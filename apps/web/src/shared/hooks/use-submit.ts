import { useState, useTransition } from 'react'
import { unlessOutdated } from '../lib/actions/outdated'
import type { ActionResult } from '../lib/actions/result'

export function useSubmit<A extends unknown[], T>(
  action: (...args: A) => Promise<ActionResult<T> | null>,
  onDone: (value: T) => void,
) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(...args: A) {
    setError(null)
    startTransition(async () => {
      const result = await unlessOutdated(() => action(...args))
      if (result === null) {
        return
      }
      if (result.ok) {
        onDone(result.value)
      } else {
        setError(result.error)
      }
    })
  }

  return { submit, pending, error }
}

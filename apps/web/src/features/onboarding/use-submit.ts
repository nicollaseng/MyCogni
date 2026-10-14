import { useState, useTransition } from 'react'
import type { ActionResult } from './model'

export function useSubmit<A extends unknown[], T>(
  action: (...args: A) => Promise<ActionResult<T>>,
  onDone: (value: T) => void,
) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(...args: A) {
    setError(null)
    startTransition(async () => {
      const result = await action(...args)
      if (result.ok) {
        onDone(result.value)
      } else {
        setError(result.error)
      }
    })
  }

  return { submit, pending, error }
}

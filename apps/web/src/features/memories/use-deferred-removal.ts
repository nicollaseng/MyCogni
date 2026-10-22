'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { unlessOutdated } from '@/shared/lib/actions/outdated'
import type { ActionResult } from '@/shared/lib/actions/result'
import type { ShownMemory } from './shown-memory'

export interface Removal {
  memory: ShownMemory
  index: number
}

interface Handlers {
  remove: (id: string) => Promise<ActionResult<null>>
  forget: (id: string) => Promise<boolean>
  onFailed: (removal: Removal, error: string | null) => void
}

export function useDeferredRemoval(handlers: Handlers) {
  const [pending, setPending] = useState<Removal | null>(null)
  const current = useRef<Removal | null>(null)
  const latest = useRef(handlers)

  useEffect(() => {
    latest.current = handlers
  })

  const take = useCallback((): Removal | null => {
    const removal = current.current
    current.current = null
    setPending(null)
    return removal
  }, [])

  const commit = useCallback(() => {
    const removal = take()
    if (removal === null) {
      return
    }
    unlessOutdated(() => latest.current.remove(removal.memory.id)).then(
      (result) => {
        if (result !== null && !result.ok) {
          latest.current.onFailed(removal, result.error)
        }
      },
      () => {
        latest.current.onFailed(removal, null)
      },
    )
  }, [take])

  const defer = useCallback(
    (removal: Removal) => {
      commit()
      current.current = removal
      setPending(removal)
    },
    [commit],
  )

  useEffect(() => {
    function commitWhenHidden() {
      const removal = document.visibilityState === 'hidden' ? take() : null
      if (removal === null) {
        return
      }
      void latest.current.forget(removal.memory.id).then((forgotten) => {
        if (!forgotten) {
          latest.current.onFailed(removal, null)
        }
      })
    }
    document.addEventListener('visibilitychange', commitWhenHidden)
    return () => {
      document.removeEventListener('visibilitychange', commitWhenHidden)
      commit()
    }
  }, [take, commit])

  return { pending, defer, commit, undo: take }
}

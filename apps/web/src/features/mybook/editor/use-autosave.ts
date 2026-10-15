import { useCallback, useEffect, useRef, useState } from 'react'

export type SaveResult = 'saved' | 'failed' | 'outdated'

export type SaveStatus = 'idle' | 'pending' | 'saving' | SaveResult

export interface Autosave {
  status: SaveStatus
  touch: () => void
  flush: () => Promise<boolean>
  cancel: () => void
}

export const autosaveDelay = 800

export function useAutosave(save: () => Promise<SaveResult>, delay = autosaveDelay): Autosave {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const latestSave = useRef(save)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirty = useRef(false)
  const outdated = useRef(false)
  const running = useRef<Promise<boolean> | null>(null)

  useEffect(() => {
    latestSave.current = save
  }, [save])

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const drain = useCallback(async (): Promise<boolean> => {
    while (dirty.current && timer.current === null && !outdated.current) {
      dirty.current = false
      setStatus('saving')
      const result = await latestSave.current().catch((): SaveResult => 'failed')
      if (result !== 'saved') {
        dirty.current = true
        outdated.current = result === 'outdated'
        setStatus(result)
        return false
      }
    }
    if (outdated.current) {
      return false
    }
    setStatus(dirty.current ? 'pending' : 'saved')
    return !dirty.current
  }, [])

  const flush = useCallback((): Promise<boolean> => {
    clearTimer()
    running.current ??= drain().finally(() => {
      running.current = null
    })
    return running.current
  }, [clearTimer, drain])

  const touch = useCallback(() => {
    dirty.current = true
    if (outdated.current) {
      return
    }
    setStatus((current) => (current === 'saving' ? current : 'pending'))
    clearTimer()
    timer.current = setTimeout(() => {
      timer.current = null
      void flush()
    }, delay)
  }, [clearTimer, delay, flush])

  const cancel = useCallback(() => {
    clearTimer()
    dirty.current = false
    setStatus((current) => (current === 'outdated' ? current : 'idle'))
  }, [clearTimer])

  useEffect(() => {
    function saveWhenHidden() {
      if (dirty.current && document.visibilityState === 'hidden') {
        void flush()
      }
    }
    document.addEventListener('visibilitychange', saveWhenHidden)
    return () => {
      document.removeEventListener('visibilitychange', saveWhenHidden)
      if (dirty.current) {
        void flush()
      }
    }
  }, [flush])

  return { status, touch, flush, cancel }
}

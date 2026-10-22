'use client'

import { voiceLimits } from '@mycogni/domain'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { Transcribe, VoiceNotice } from './transcribe'
import { MicrophoneDeniedError, type VoiceCapture, type VoiceMedia } from './voice-media'

export type VoiceStatus = 'idle' | 'opening' | 'recording' | 'transcribing'

export type VoiceIntent = 'review' | 'send'

interface VoiceInputOptions {
  media: VoiceMedia
  transcribe: Transcribe
  onText: (text: string, intent: VoiceIntent) => void
  duck: (ducked: boolean) => void
}

const tickMs = 250

function subscribeToNothing(): () => void {
  return () => undefined
}

export function useVoiceInput(options: VoiceInputOptions) {
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [notice, setNotice] = useState<VoiceNotice | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const capture = useRef<VoiceCapture | null>(null)
  const startedAt = useRef(0)
  const ducked = useRef(false)
  const latest = useRef(options)
  const { media } = options
  const supported = useSyncExternalStore(
    subscribeToNothing,
    () => media.supported(),
    () => false,
  )

  useEffect(() => {
    latest.current = options
  })

  const quiet = useCallback((on: boolean) => {
    if (ducked.current !== on) {
      ducked.current = on
      latest.current.duck(on)
    }
  }, [])

  const level = useCallback(() => capture.current?.level() ?? 0, [])

  const finish = useCallback(
    async (intent: VoiceIntent): Promise<void> => {
      const current = capture.current
      if (current === null) {
        return
      }
      capture.current = null
      setStatus('transcribing')
      const audio = await current.finish()
      quiet(false)
      const result = await latest.current.transcribe(audio)
      setStatus('idle')
      if (!result.ok) {
        setNotice(result.notice)
        return
      }
      latest.current.onText(result.text, intent)
    },
    [quiet],
  )

  async function start(): Promise<void> {
    if (status !== 'idle') {
      return
    }
    setNotice(null)
    setStatus('opening')
    try {
      capture.current = await media.open()
    } catch (error) {
      setStatus('idle')
      setNotice(error instanceof MicrophoneDeniedError ? 'denied' : 'failed')
      return
    }
    startedAt.current = Date.now()
    setElapsed(0)
    quiet(true)
    setStatus('recording')
  }

  function cancel(): void {
    capture.current?.discard()
    capture.current = null
    quiet(false)
    setStatus('idle')
  }

  useEffect(() => {
    if (status !== 'recording') {
      return undefined
    }
    const timer = window.setInterval(() => {
      const seconds = (Date.now() - startedAt.current) / 1000
      setElapsed(Math.floor(seconds))
      if (seconds >= voiceLimits.maxSeconds) {
        void finish('review')
      }
    }, tickMs)
    return () => {
      window.clearInterval(timer)
    }
  }, [status, finish])

  useEffect(
    () => () => {
      capture.current?.discard()
      capture.current = null
      quiet(false)
    },
    [quiet],
  )

  return {
    supported,
    status,
    notice,
    elapsed,
    level,
    start,
    cancel,
    finish,
    clearNotice: () => {
      setNotice(null)
    },
  }
}

export type VoiceInput = ReturnType<typeof useVoiceInput>

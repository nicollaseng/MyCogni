'use client'

import {
  soundProgrammes,
  timerSeconds,
  type SoundMode,
  type SoundProgrammeId,
  type SoundTimer,
} from '@mycogni/domain'
import { useEffect, useRef, useState } from 'react'
import { useAmbient } from '@/features/audio/ambient-provider'
import type { RecordPractice } from '../practice/record'
import type { FrequencyEngine } from './frequency-engine'

export type SoundStatus = 'ready' | 'playing' | 'ended'

const tickMs = 500

interface SoundSessionOptions {
  programme: SoundProgrammeId
  engine: FrequencyEngine
  record: RecordPractice
}

export function useSoundSession({ programme, engine, record }: SoundSessionOptions) {
  const { hold } = useAmbient()
  const [status, setStatus] = useState<SoundStatus>('ready')
  const [timer, setTimer] = useState<SoundTimer>(20)
  const [mode, setMode] = useState<SoundMode>('binaural')
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef<Date | null>(null)
  const latest = useRef({ engine, record, hold, timer, status })

  useEffect(() => {
    latest.current = { engine, record, hold, timer, status }
  })

  function seconds(): number {
    return startedAt.current === null ? 0 : (Date.now() - startedAt.current.getTime()) / 1000
  }

  function finish(completed: boolean): void {
    const { engine: player, record: save, hold: release } = latest.current
    const listened = seconds()
    setElapsed(listened)
    setStatus('ended')
    void player.stop().then(() => {
      release(false)
    })
    void save({
      kind: 'sound',
      contentId: programme,
      startedAt: startedAt.current ?? new Date(),
      seconds: listened,
      completed,
    })
  }

  const latestFinish = useRef(finish)

  useEffect(() => {
    latestFinish.current = finish
  })

  useEffect(() => {
    if (status !== 'playing') {
      return undefined
    }
    const timerId = window.setInterval(() => {
      const now = seconds()
      setElapsed(now)
      const limit = timerSeconds(latest.current.timer)
      if (limit !== null && now >= limit) {
        latestFinish.current(true)
      }
    }, tickMs)
    return () => {
      window.clearInterval(timerId)
    }
  }, [status])

  useEffect(
    () => () => {
      if (latest.current.status === 'playing') {
        latestFinish.current(false)
      }
    },
    [],
  )

  return {
    status,
    timer,
    mode,
    elapsed,
    remaining: (() => {
      const limit = timerSeconds(timer)
      return limit === null ? null : Math.max(0, limit - elapsed)
    })(),
    setTimer,
    setMode,
    start: () => {
      startedAt.current = new Date()
      setElapsed(0)
      hold(true)
      engine.start(soundProgrammes[programme], mode)
      setStatus('playing')
    },
    stop: () => {
      finish(false)
    },
  }
}

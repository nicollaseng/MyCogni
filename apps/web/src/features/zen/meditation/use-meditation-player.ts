'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { useAmbient } from '@/features/audio/ambient-provider'
import { itemAt, type Timeline, type TimelineItem } from './timeline'

export type PlayerStatus = 'ready' | 'playing' | 'paused' | 'ended'

export const meditationSkipSeconds = 15

const tickMs = 250

interface Clock {
  position: number
  at: number
}

export function useMeditationPlayer(
  timeline: Timeline,
  audioRef: RefObject<HTMLAudioElement | null>,
  onEnd: (listened: number) => void,
) {
  const { duck } = useAmbient()
  const [status, setStatus] = useState<PlayerStatus>('ready')
  const [position, setPosition] = useState(0)
  const clock = useRef<Clock>({ position: 0, at: 0 })
  const current = useRef<TimelineItem | null>(null)
  const voiceEnded = useRef(false)
  const listened = useRef(0)
  const latestEnd = useRef(onEnd)

  useEffect(() => {
    latestEnd.current = onEnd
  })

  const place = useCallback(
    (target: number, playing: boolean) => {
      const clamped = Math.min(Math.max(target, 0), timeline.total)
      clock.current = { position: clamped, at: Date.now() }
      setPosition(clamped)
      const item = itemAt(timeline, clamped)
      current.current = item
      voiceEnded.current = false
      const element = audioRef.current
      if (element === null) {
        return
      }
      if (item?.kind !== 'voice') {
        element.pause()
        return
      }
      if (element.dataset.url !== item.url) {
        element.dataset.url = item.url
        element.src = item.url
      }
      element.currentTime = clamped - item.start
      if (playing) {
        void element.play().catch(() => {
          voiceEnded.current = true
        })
      }
    },
    [audioRef, timeline],
  )

  const finish = useCallback(() => {
    audioRef.current?.pause()
    setPosition(timeline.total)
    setStatus('ended')
    latestEnd.current(listened.current)
  }, [audioRef, timeline.total])

  useEffect(() => {
    if (status !== 'playing') {
      return undefined
    }
    const timer = window.setInterval(() => {
      const now = Date.now()
      listened.current += (now - clock.current.at) / 1000
      const item = current.current
      const element = audioRef.current
      let next: number
      if (item?.kind === 'voice' && !voiceEnded.current && element !== null) {
        next = item.start + element.currentTime
      } else if (item?.kind === 'voice') {
        next = Math.max(item.start + item.duration, clock.current.position)
      } else {
        next = clock.current.position + (now - clock.current.at) / 1000
      }
      if (next >= timeline.total) {
        finish()
        return
      }
      if (itemAt(timeline, next) !== item) {
        place(next, true)
        return
      }
      clock.current = { position: next, at: now }
      setPosition(next)
    }, tickMs)
    return () => {
      window.clearInterval(timer)
    }
  }, [status, timeline, audioRef, place, finish])

  useEffect(() => {
    if (status !== 'playing') {
      return undefined
    }
    duck(true)
    return () => {
      duck(false)
    }
  }, [status, duck])

  return {
    status,
    position,
    total: timeline.total,
    listened: () => listened.current,
    toggle: () => {
      if (status === 'playing') {
        audioRef.current?.pause()
        setStatus('paused')
        return
      }
      const from = status === 'ended' ? 0 : clock.current.position
      place(from, true)
      setStatus('playing')
    },
    skip: (seconds: number) => {
      const target = clock.current.position + seconds
      if (target >= timeline.total) {
        finish()
        return
      }
      place(target, status === 'playing')
    },
    voiceEnded: () => {
      voiceEnded.current = true
    },
  }
}

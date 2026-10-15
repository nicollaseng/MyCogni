'use client'

import { useCallback, useEffect, useState, type RefObject } from 'react'
import { useAmbient } from './ambient-provider'

export const skipSeconds = 15

export interface NarrationAudio {
  playing: boolean
  started: boolean
  time: number
  duration: number
  toggle: () => void
  skip: (seconds: number) => void
  seek: (seconds: number) => void
  events: {
    onPlay: () => void
    onPause: () => void
    onEnded: () => void
    onTimeUpdate: () => void
    onLoadedMetadata: () => void
    onDurationChange: () => void
  }
}

export function useNarrationAudio(
  ref: RefObject<HTMLAudioElement | null>,
  title: string,
  rate: number,
): NarrationAudio {
  const { duck } = useAmbient()
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const seek = useCallback(
    (seconds: number) => {
      const element = ref.current
      if (element === null) {
        return
      }
      const limit = Number.isFinite(element.duration) ? element.duration : seconds
      element.currentTime = Math.min(Math.max(seconds, 0), limit)
      setTime(element.currentTime)
    },
    [ref],
  )

  const skip = useCallback(
    (seconds: number) => {
      seek((ref.current?.currentTime ?? 0) + seconds)
    },
    [ref, seek],
  )

  const toggle = useCallback(() => {
    const element = ref.current
    if (element === null) {
      return
    }
    setStarted(true)
    if (element.paused) {
      void element.play().catch(() => {
        setPlaying(false)
      })
    } else {
      element.pause()
    }
  }, [ref])

  useEffect(() => {
    if (ref.current !== null) {
      ref.current.playbackRate = rate
    }
  }, [ref, rate])

  useEffect(() => {
    if (!playing) {
      return undefined
    }
    duck(true)
    return () => {
      duck(false)
    }
  }, [playing, duck])

  useEffect(() => {
    if (!playing || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') {
      return undefined
    }
    const session = navigator.mediaSession
    session.metadata = new MediaMetadata({ title, artist: 'MyCogniAI', album: 'Zen Space' })
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      [
        'play',
        () => {
          void ref.current?.play()
        },
      ],
      [
        'pause',
        () => {
          ref.current?.pause()
        },
      ],
      [
        'seekbackward',
        () => {
          skip(-skipSeconds)
        },
      ],
      [
        'seekforward',
        () => {
          skip(skipSeconds)
        },
      ],
    ]
    for (const [action, handler] of handlers) {
      session.setActionHandler(action, handler)
    }
    return () => {
      for (const [action] of handlers) {
        session.setActionHandler(action, null)
      }
    }
  }, [ref, playing, title, skip])

  const sync = useCallback(() => {
    const element = ref.current
    if (element !== null) {
      setTime(element.currentTime)
      setDuration(Number.isFinite(element.duration) ? element.duration : 0)
    }
  }, [ref])

  return {
    playing,
    started,
    time,
    duration,
    toggle,
    skip,
    seek,
    events: {
      onPlay: () => {
        if (ref.current !== null) {
          ref.current.playbackRate = rate
        }
        setPlaying(true)
      },
      onPause: () => {
        setPlaying(false)
      },
      onEnded: () => {
        setPlaying(false)
      },
      onTimeUpdate: sync,
      onLoadedMetadata: sync,
      onDurationChange: sync,
    },
  }
}

'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'
import { activeLevel, barHeight, formatElapsed, pushLevel, waveformBars } from './waveform'

interface VoiceWaveformProps {
  level: () => number
  elapsed: number
  reducedMotion: boolean
}

const frameMs = 33

const stepMs = 90

const quietHistory: readonly number[] = Array.from({ length: waveformBars }, () => 0)

export function VoiceWaveform({ level, elapsed, reducedMotion }: VoiceWaveformProps) {
  const t = useTranslations('voice')
  const bars = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    if (reducedMotion) {
      return undefined
    }
    let history = [...quietHistory]
    let frame = 0
    let drawn = 0
    let stepped = 0
    const render = (now: number) => {
      if (now - drawn >= frameMs) {
        drawn = now
        const current = level()
        if (now - stepped >= stepMs) {
          stepped = now
          history = pushLevel(history, current)
        } else {
          history[history.length - 1] = Math.max(history.at(-1) ?? 0, current)
        }
        bars.current.forEach((bar, index) => {
          const value = history[index] ?? 0
          if (bar !== null) {
            bar.style.height = `${String(barHeight(value))}px`
            bar.dataset.active = value >= activeLevel ? 'true' : 'false'
          }
        })
      }
      frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [level, reducedMotion])

  if (reducedMotion) {
    return (
      <p
        data-testid="voice-recording-static"
        className="flex min-w-0 flex-1 items-center justify-center gap-2 text-sm text-muted-foreground tabular-nums"
      >
        <span aria-hidden className="size-2 shrink-0 rounded-full bg-emphasis" />
        {t('elapsed', { time: formatElapsed(elapsed) })}
      </p>
    )
  }

  return (
    <div
      aria-hidden
      data-testid="voice-waveform"
      className="flex h-8 min-w-0 flex-1 items-center justify-end gap-[3px] overflow-hidden px-1"
    >
      {quietHistory.map((_, index) => (
        <span
          key={index}
          ref={(element) => {
            bars.current[index] = element
          }}
          data-active="false"
          className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50 transition-[height,background-color] duration-75 ease-out data-[active=true]:bg-foreground motion-reduce:transition-none"
        />
      ))}
    </div>
  )
}

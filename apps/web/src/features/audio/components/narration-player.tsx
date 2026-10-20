'use client'

import { contentLanguageOf, narrationSpeeds, voiceFor, type NarrationSpeed } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useRef } from 'react'
import { BackIcon, ForwardIcon, PauseIcon, PlayIcon } from '@/shared/components/icons'
import type { NarrationSource } from '../narration'
import { saveAudioPreferences, useAudioPreferences } from '../preferences'
import { skipSeconds, useNarrationAudio } from '../use-narration-audio'

interface NarrationPlayerProps {
  sources: readonly NarrationSource[]
  title: string
  compact?: boolean
}

export function clockOf(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(whole / 60))}:${String(whole % 60).padStart(2, '0')}`
}

function nextSpeed(speed: NarrationSpeed): NarrationSpeed {
  const index = narrationSpeeds.indexOf(speed)
  return narrationSpeeds[(index + 1) % narrationSpeeds.length] ?? 1
}

const skipButton =
  'inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm text-foreground tabular-nums transition-colors duration-150 hover:bg-sage motion-reduce:transition-none'

export function NarrationPlayer({ sources, title, compact = false }: NarrationPlayerProps) {
  const t = useTranslations('audio.player')
  const language = contentLanguageOf(useLocale())
  const { voice, speed } = useAudioPreferences()
  const chosen = voiceFor(language, voice)
  const source = sources.find((candidate) => candidate.voice === chosen) ?? sources[0]
  const element = useRef<HTMLAudioElement>(null)
  const audio = useNarrationAudio(element, title, speed)
  const progressId = useId()

  if (source === undefined) {
    return null
  }

  const full = !compact && audio.started

  return (
    <div
      role={full ? 'group' : undefined}
      aria-label={full ? t('label') : undefined}
      className={
        full
          ? 'basis-full space-y-2 rounded-lg bg-surface px-3 py-3 sm:px-4'
          : 'flex items-center gap-3'
      }
    >
      <audio
        ref={element}
        src={source.url}
        preload="metadata"
        onPlay={audio.events.onPlay}
        onPause={audio.events.onPause}
        onEnded={audio.events.onEnded}
        onTimeUpdate={audio.events.onTimeUpdate}
        onLoadedMetadata={audio.events.onLoadedMetadata}
        onDurationChange={audio.events.onDurationChange}
      />
      {full ? (
        <>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={audio.toggle}
              aria-label={audio.playing ? t('pause') : t('play')}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors duration-150 hover:bg-primary/90 motion-reduce:transition-none"
            >
              {audio.playing ? <PauseIcon className="size-5" /> : <PlayIcon className="size-5" />}
            </button>
            <div className="min-w-0 flex-1 px-1">
              <label htmlFor={progressId} className="sr-only">
                {t('position')}
              </label>
              <input
                id={progressId}
                type="range"
                min={0}
                max={Math.max(audio.duration, 1)}
                step={1}
                value={Math.min(audio.time, Math.max(audio.duration, 1))}
                aria-valuetext={t('positionValue', {
                  time: clockOf(audio.time),
                  total: clockOf(audio.duration),
                })}
                onChange={(event) => {
                  audio.seek(Number(event.currentTarget.value))
                }}
                className="audio-range"
              />
              <p className="flex justify-between text-xs text-muted-foreground tabular-nums">
                <span>{clockOf(audio.time)}</span>
                <span>{clockOf(audio.duration)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  audio.skip(-skipSeconds)
                }}
                aria-label={t('back', { seconds: skipSeconds })}
                className={skipButton}
              >
                <BackIcon className="size-5" />
                <span aria-hidden>{skipSeconds}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  audio.skip(skipSeconds)
                }}
                aria-label={t('forward', { seconds: skipSeconds })}
                className={skipButton}
              >
                <span aria-hidden>{skipSeconds}</span>
                <ForwardIcon className="size-5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                saveAudioPreferences({ speed: nextSpeed(speed) })
              }}
              aria-label={t('speed', { speed })}
              className="inline-flex h-11 items-center rounded-md px-3 text-sm tabular-nums transition-colors duration-150 hover:bg-sage motion-reduce:transition-none"
            >
              {t('speedShort', { speed })}
            </button>
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={audio.toggle}
            aria-label={audio.playing ? t('pause') : t('listenTo', { title })}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-rule px-3.5 text-[15px] transition-colors duration-150 hover:bg-sage motion-reduce:transition-none"
          >
            {audio.playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
            {audio.playing ? t('pause') : t('listen')}
          </button>
          {audio.started && audio.duration > 0 && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {clockOf(audio.duration - audio.time)}
            </span>
          )}
        </>
      )}
    </div>
  )
}

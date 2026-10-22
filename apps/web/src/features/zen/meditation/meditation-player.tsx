'use client'

import { contentLanguageOf, voiceFor, type MeditationLength } from '@mycogni/domain'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { clockOf } from '@/features/audio/components/narration-player'
import { useAudioPreferences } from '@/features/audio/preferences'
import { BackIcon, ForwardIcon } from '@/shared/components/icons'
import { cn } from '@/shared/lib/utils'
import { Button, buttonVariants } from '@/shared/ui/button'
import { ZenContour } from '../components/zen-contour'
import { AfterPractice } from '../practice/after-practice'
import type { RecordPractice, RememberFeeling } from '../practice/record'
import type { MeditationOption } from './options'
import { buildTimeline } from './timeline'
import { meditationSkipSeconds, useMeditationPlayer } from './use-meditation-player'

const minimumUnfinishedSeconds = 60

interface MeditationPlayerProps {
  option: MeditationOption
  onClose: () => void
  record: RecordPractice
  remember: RememberFeeling
}

const skipButton =
  'inline-flex h-12 min-w-16 items-center justify-center gap-1.5 rounded-md px-3 text-sm text-zen-foreground/85 tabular-nums transition-colors hover:bg-zen-foreground/10 motion-reduce:transition-none'

export function MeditationPlayer({ option, onClose, record, remember }: MeditationPlayerProps) {
  const t = useTranslations('zen.meditations')
  const language = contentLanguageOf(useLocale())
  const { voice } = useAudioPreferences()
  const [length, setLength] = useState<MeditationLength>('short')
  const [sessionId, setSessionId] = useState<string | null | undefined>(undefined)
  const element = useRef<HTMLAudioElement>(null)
  const startedAt = useRef<Date | null>(null)
  const chosen = voiceFor(language, voice)
  const lines = (option.voices.find((candidate) => candidate.voice === chosen) ?? option.voices[0])
    ?.lines
  const timeline = useMemo(
    () => buildTimeline(option.plans[length], lines ?? []),
    [option.plans, length, lines],
  )
  const player = useMeditationPlayer(timeline, element, (listened) => {
    void record({
      kind: 'meditation',
      contentId: option.id,
      startedAt: startedAt.current ?? new Date(),
      seconds: listened,
      completed: true,
    }).then(setSessionId)
  })
  const latest = useRef({ player, record })

  useEffect(() => {
    latest.current = { player, record }
  })

  useEffect(
    () => () => {
      const { player: last, record: save } = latest.current
      const listened = last.listened()
      if (last.status !== 'ended' && listened >= minimumUnfinishedSeconds) {
        void save({
          kind: 'meditation',
          contentId: option.id,
          startedAt: startedAt.current ?? new Date(),
          seconds: listened,
          completed: false,
        })
      }
    },
    [option.id],
  )

  const ended = player.status === 'ended'
  const playing = player.status === 'playing'

  return (
    <div className="flex w-full flex-col items-center gap-8 sm:gap-10">
      <audio
        ref={element}
        preload="auto"
        onEnded={player.voiceEnded}
        onError={player.voiceEnded}
        data-testid="meditation-audio"
      />
      <div className="relative flex size-[300px] shrink-0 items-center justify-center sm:size-[440px]">
        <ZenContour
          rings={7}
          calm={0.86}
          base={72}
          gap={11}
          drift={playing}
          className={cn(
            'absolute inset-0 size-full text-zen-line',
            playing && 'animate-zen-swell motion-reduce:animate-none',
          )}
        />
        {ended ? (
          <p className="relative font-serif text-[40px] leading-none tracking-[-0.02em] sm:text-[52px]">
            {t('done')}
          </p>
        ) : (
          <p
            data-testid="meditation-clock"
            className="relative font-serif text-[32px] leading-none tabular-nums sm:text-[40px]"
          >
            {clockOf(player.position)}
            <span className="block pt-2 text-center font-sans text-sm text-zen-foreground/70">
              {t('of', { total: clockOf(player.total) })}
            </span>
          </p>
        )}
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {ended ? t('done') : playing ? t('playing') : ''}
      </p>
      {ended ? (
        <div className="flex flex-col items-center gap-6">
          <AfterPractice
            question={t('howNow')}
            sessionId={sessionId}
            remember={remember}
            offer={false}
          />
          <div className="flex w-full max-w-[22rem] gap-3">
            <Link
              href="/mybook"
              className={cn(buttonVariants({ variant: 'inverse', size: 'lg' }), 'flex-1')}
            >
              {t('write')}
            </Link>
            <Button size="lg" variant="inverseOutline" className="flex-1" onClick={onClose}>
              {t('close')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5">
          {player.status === 'ready' && (
            <div role="group" aria-label={t('length')} className="flex gap-2">
              {(['short', 'long'] as const).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  aria-pressed={length === choice}
                  onClick={() => {
                    setLength(choice)
                  }}
                  className={cn(
                    'h-10 rounded-md border px-4 text-sm transition-colors motion-reduce:transition-none',
                    length === choice
                      ? 'border-zen-foreground bg-zen-foreground/10 text-zen-foreground'
                      : 'border-zen-foreground/25 text-zen-foreground/75 hover:bg-zen-foreground/10',
                  )}
                >
                  {t('minutes', { minutes: option.minutes[choice] })}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={t('back', { seconds: meditationSkipSeconds })}
              disabled={player.status === 'ready'}
              onClick={() => {
                player.skip(-meditationSkipSeconds)
              }}
              className={cn(skipButton, 'disabled:opacity-40')}
            >
              <BackIcon className="size-4" />
              {meditationSkipSeconds}
            </button>
            <Button
              size="lg"
              variant={playing ? 'inverseOutline' : 'inverse'}
              className="min-w-36"
              onClick={() => {
                startedAt.current ??= new Date()
                player.toggle()
              }}
            >
              {playing ? t('pause') : player.status === 'paused' ? t('resume') : t('start')}
            </Button>
            <button
              type="button"
              aria-label={t('forward', { seconds: meditationSkipSeconds })}
              disabled={player.status === 'ready'}
              onClick={() => {
                player.skip(meditationSkipSeconds)
              }}
              className={cn(skipButton, 'disabled:opacity-40')}
            >
              {meditationSkipSeconds}
              <ForwardIcon className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

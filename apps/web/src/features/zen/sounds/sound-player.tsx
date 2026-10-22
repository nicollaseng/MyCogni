'use client'

import { soundModes, soundTimers, type SoundProgrammeId } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { clockOf } from '@/features/audio/components/narration-player'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { ZenContour } from '../components/zen-contour'
import type { RecordPractice } from '../practice/record'
import type { FrequencyEngine } from './frequency-engine'
import { ProgrammeIcon } from './programme-icon'
import { useSoundSession } from './use-sound-session'

export const cautionKey = 'mycogni.sounds.caution'

interface SoundPlayerProps {
  programme: SoundProgrammeId
  engine: FrequencyEngine
  record: RecordPractice
  onClose: () => void
}

function cautionSeen(): boolean {
  try {
    return window.localStorage.getItem(cautionKey) === 'seen'
  } catch {
    return false
  }
}

function rememberCaution(): void {
  try {
    window.localStorage.setItem(cautionKey, 'seen')
  } catch {
    return
  }
}

function choiceClass(selected: boolean): string {
  return cn(
    'h-10 rounded-md border px-3.5 text-sm transition-colors motion-reduce:transition-none',
    selected
      ? 'border-zen-foreground bg-zen-foreground/10 text-zen-foreground'
      : 'border-zen-foreground/25 text-zen-foreground/75 hover:bg-zen-foreground/10',
  )
}

export function SoundPlayer({ programme, engine, record, onClose }: SoundPlayerProps) {
  const t = useTranslations('zen.sounds')
  const [showCaution] = useState(() => !cautionSeen())
  const session = useSoundSession({ programme, engine, record })
  const playing = session.status === 'playing'
  const ended = session.status === 'ended'

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-7 sm:gap-9">
      <div className="relative flex size-[260px] shrink-0 items-center justify-center sm:size-[340px]">
        <ZenContour
          rings={7}
          calm={0.9}
          base={72}
          gap={11}
          drift={playing}
          className={cn(
            'absolute inset-0 size-full text-zen-line',
            playing && 'animate-zen-swell motion-reduce:animate-none',
          )}
        />
        <div className="relative flex flex-col items-center gap-3 text-center">
          <ProgrammeIcon id={programme} className="size-8 text-zen-foreground/80" />
          <p
            data-testid="sound-clock"
            className={cn(
              'font-serif leading-none tabular-nums',
              playing || ended ? 'text-[32px] sm:text-[40px]' : 'text-[22px] sm:text-[26px]',
            )}
          >
            {ended
              ? t('done')
              : playing
                ? session.remaining === null
                  ? clockOf(session.elapsed)
                  : clockOf(session.remaining)
                : t(`purposes.${programme}`)}
          </p>
          {playing && session.remaining !== null && (
            <p className="text-sm text-zen-foreground/70">{t('remaining')}</p>
          )}
        </div>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {playing ? t('playing') : ended ? t('done') : ''}
      </p>
      {session.status === 'ready' && (
        <div className="flex w-full flex-col items-center gap-4">
          <div role="group" aria-label={t('timer')} className="flex flex-wrap justify-center gap-2">
            {soundTimers.map((timer) => (
              <button
                key={String(timer)}
                type="button"
                aria-pressed={session.timer === timer}
                onClick={() => {
                  session.setTimer(timer)
                }}
                className={choiceClass(session.timer === timer)}
              >
                {timer === null ? t('endless') : t('minutes', { minutes: timer })}
              </button>
            ))}
          </div>
          <div role="group" aria-label={t('modeLabel')} className="flex justify-center gap-2">
            {soundModes.map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={session.mode === mode}
                onClick={() => {
                  session.setMode(mode)
                }}
                className={choiceClass(session.mode === mode)}
              >
                {t(`modes.${mode}`)}
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-pretty text-zen-foreground/75">
            {t('headphones')}
          </p>
          {showCaution && (
            <p
              data-testid="sound-caution"
              className="text-center text-sm text-pretty text-zen-foreground/75"
            >
              {t('caution')}
            </p>
          )}
        </div>
      )}
      <div className="flex w-full max-w-[22rem] gap-3">
        {ended ? (
          <Button size="lg" variant="inverse" className="flex-1" onClick={onClose}>
            {t('close')}
          </Button>
        ) : (
          <Button
            size="lg"
            variant={playing ? 'inverseOutline' : 'inverse'}
            className="flex-1"
            onClick={() => {
              if (playing) {
                session.stop()
              } else {
                rememberCaution()
                session.start()
              }
            }}
          >
            {playing ? t('stop') : t('start')}
          </Button>
        )}
      </div>
    </div>
  )
}

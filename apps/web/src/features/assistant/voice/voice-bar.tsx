'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, type KeyboardEvent } from 'react'
import { CloseIcon, StopIcon } from '@/shared/components/icons'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { RoundButton } from './round-button'
import type { VoiceInput } from './use-voice-input'
import { VoiceWaveform } from './voice-waveform'

export function VoiceBar({ voice }: { voice: VoiceInput }) {
  const t = useTranslations('voice')
  const reducedMotion = usePrefersReducedMotion()
  const stop = useRef<HTMLButtonElement>(null)
  const transcribing = voice.status === 'transcribing'

  useEffect(() => {
    stop.current?.focus()
  }, [])

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && voice.status === 'recording') {
      event.preventDefault()
      event.stopPropagation()
      voice.cancel()
    }
  }

  return (
    <div
      role="group"
      aria-label={t('recording')}
      data-testid="voice-bar"
      onKeyDown={onKeyDown}
      className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-[6px] border border-rule bg-background px-1.5"
    >
      <RoundButton
        label={t('cancel')}
        className="size-9"
        disabled={transcribing}
        onClick={voice.cancel}
      >
        <CloseIcon className="size-4" />
      </RoundButton>
      {transcribing ? (
        <p className="min-w-0 flex-1 animate-breathe text-center text-sm text-muted-foreground motion-reduce:animate-none">
          {t('transcribing')}
        </p>
      ) : (
        <VoiceWaveform level={voice.level} elapsed={voice.elapsed} reducedMotion={reducedMotion} />
      )}
      <RoundButton
        ref={stop}
        label={t('stop')}
        className="size-9"
        disabled={transcribing}
        onClick={() => void voice.finish('review')}
      >
        <StopIcon className="size-4" />
      </RoundButton>
    </div>
  )
}

'use client'

import { useTranslations } from 'next-intl'
import { useAmbient } from '@/features/audio/ambient-provider'
import { PauseIcon, PlayIcon } from '@/shared/components/icons'

export function SoundNow() {
  const t = useTranslations('audio.ambient')
  const { loop, playing, toggle } = useAmbient()

  if (loop === null) {
    return null
  }

  const sound = t(`sounds.${loop}`)

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? t('pauseSound', { sound }) : t('playSound', { sound })}
      className="inline-flex h-10 items-center gap-2.5 rounded-md border border-zen-foreground/30 px-3 text-sm text-zen-foreground transition-colors duration-150 hover:bg-zen-foreground/10 motion-reduce:transition-none"
    >
      <span className="flex size-6 items-center justify-center rounded-sm bg-zen-foreground text-zen">
        {playing ? <PauseIcon className="size-3.5" /> : <PlayIcon className="size-3.5" />}
      </span>
      <span>
        <span className="font-medium">{sound}</span>
        <span className="text-zen-foreground/70"> · {playing ? t('playing') : t('paused')}</span>
      </span>
    </button>
  )
}

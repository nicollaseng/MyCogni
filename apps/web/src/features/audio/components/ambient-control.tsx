'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { useAmbient } from '../ambient-provider'
import { SoundIcon } from './sound-icon'

export function AmbientControl() {
  const t = useTranslations('audio.ambient')
  const { loop, onZenHome, playing, toggle } = useAmbient()

  if (loop === null || onZenHome) {
    return null
  }

  const name = t(`sounds.${loop}`)

  return (
    <button
      type="button"
      aria-pressed={playing}
      aria-label={t('control', { sound: name })}
      onClick={toggle}
      className={cn(
        'inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-md px-2.5 text-sm transition-colors duration-150 motion-reduce:transition-none',
        playing
          ? 'bg-sage text-foreground'
          : 'text-muted-foreground hover:bg-sage/60 hover:text-foreground',
      )}
    >
      <SoundIcon sound={loop} className="size-[18px]" />
      <span className="hidden whitespace-nowrap sm:inline">{name}</span>
    </button>
  )
}

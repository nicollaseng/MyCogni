'use client'

import { useTranslations } from 'next-intl'
import { PauseIcon, WaveIcon } from '@/shared/components/icons'
import { cn } from '@/shared/lib/utils'
import { useAmbient } from '../ambient-provider'

export function AmbientControl() {
  const t = useTranslations('audio.ambient')
  const { loop, playing, toggle } = useAmbient()

  if (loop === null) {
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
        'inline-flex h-10 items-center gap-2 rounded-md px-2.5 text-sm transition-colors duration-150 hover:bg-sage motion-reduce:transition-none',
        playing ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {playing ? <PauseIcon className="size-4" /> : <WaveIcon className="size-4" />}
      <span>{name}</span>
    </button>
  )
}

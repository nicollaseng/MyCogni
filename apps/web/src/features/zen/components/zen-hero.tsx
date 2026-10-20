'use client'

import { useTranslations } from 'next-intl'
import { useAmbient } from '@/features/audio/ambient-provider'
import { PauseIcon, PlayIcon } from '@/shared/components/icons'
import { ZenContour } from './zen-contour'

function SoundNow() {
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
      className="inline-flex h-11 items-center gap-3 rounded-md border border-rule bg-background px-3.5 text-sm transition-colors duration-150 hover:bg-sage motion-reduce:transition-none"
    >
      <span className="flex size-6 items-center justify-center rounded-sm bg-zen text-zen-foreground">
        {playing ? <PauseIcon className="size-3.5" /> : <PlayIcon className="size-3.5" />}
      </span>
      <span>
        <span className="font-medium">{sound}</span>
        <span className="text-muted-foreground"> · {playing ? t('playing') : t('paused')}</span>
      </span>
    </button>
  )
}

export function ZenHero({ title }: { title: string }) {
  return (
    <header className="relative -mx-6 -mt-4 flex min-h-[16rem] items-end overflow-hidden px-6 pt-8 pb-2 sm:mx-0 sm:-mt-6 sm:min-h-[20rem] sm:px-0">
      <ZenContour className="absolute top-0 -right-24 size-[260px] text-emphasis opacity-55 sm:top-2 sm:right-0 sm:size-[300px]" />
      <div className="relative space-y-6">
        <h1 className="font-serif text-[56px] leading-[0.95] tracking-[-0.03em] sm:text-[72px]">
          {title}
        </h1>
        <SoundNow />
      </div>
    </header>
  )
}

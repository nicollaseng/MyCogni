'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { TopicIcon } from '../components/topic-icon'
import { MeditationMode } from './meditation-mode'
import type { MeditationOption } from './options'

export function MeditationCards({ options }: { options: readonly MeditationOption[] }) {
  const t = useTranslations('zen.meditations')
  const [open, setOpen] = useState<MeditationOption | null>(null)

  if (options.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="zen-meditations" className="space-y-4">
      <h2 id="zen-meditations" className="font-serif text-[26px] leading-tight tracking-[-0.01em]">
        {t('title')}
      </h2>
      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => {
                setOpen(option)
              }}
              className="flex min-h-20 w-full items-center gap-4 rounded-lg bg-surface px-4 py-3.5 text-left transition-colors duration-150 hover:bg-sage motion-reduce:transition-none"
            >
              <TopicIcon id={option.topic} className="size-6 shrink-0 text-emphasis" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-pretty">{option.title}</span>
                <span className="block text-sm text-muted-foreground">
                  {t('choices', { short: option.minutes.short, long: option.minutes.long })}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open !== null && (
        <MeditationMode
          option={open}
          onClose={() => {
            setOpen(null)
          }}
        />
      )}
    </section>
  )
}

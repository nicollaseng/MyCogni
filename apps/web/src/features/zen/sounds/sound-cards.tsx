'use client'

import { soundProgrammeIds, type SoundProgrammeId } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { ProgrammeIcon } from './programme-icon'
import { SoundMode } from './sound-mode'

export function SoundCards() {
  const t = useTranslations('zen.sounds')
  const [open, setOpen] = useState<SoundProgrammeId | null>(null)

  return (
    <section aria-labelledby="zen-sounds" className="space-y-4">
      <h2 id="zen-sounds" className="font-serif text-[26px] leading-tight tracking-[-0.01em]">
        {t('title')}
      </h2>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {soundProgrammeIds.map((id) => (
          <li key={id}>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => {
                setOpen(id)
              }}
              className="flex min-h-28 w-full flex-col justify-between gap-4 rounded-lg bg-surface px-4 py-4 text-left transition-colors duration-150 hover:bg-sage motion-reduce:transition-none"
            >
              <ProgrammeIcon id={id} className="text-emphasis" />
              <span>
                <span className="block font-medium">{t(`names.${id}`)}</span>
                <span className="block text-sm text-muted-foreground">{t(`purposes.${id}`)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open !== null && (
        <SoundMode
          programme={open}
          onClose={() => {
            setOpen(null)
          }}
        />
      )}
    </section>
  )
}

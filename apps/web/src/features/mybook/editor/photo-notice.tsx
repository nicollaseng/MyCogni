'use client'

import { journalLimits } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import type { PhotoProblem } from './photos'

interface PhotoNoticeProps {
  problem: PhotoProblem
  onDismiss: () => void
}

export function PhotoNotice({ problem, onDismiss }: PhotoNoticeProps) {
  const t = useTranslations('mybook.editor.photo')

  return (
    <div className="flex items-start justify-between gap-4 rounded-[8px] bg-danger/[0.07] px-4 py-3 text-[15px] text-danger">
      <p role="alert" className="leading-relaxed">
        {problem === 'tooMany' ? t('tooMany', { max: journalLimits.imagesPerEntry }) : t(problem)}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t('dismiss')}
        className="-mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-[4px] text-lg leading-none hover:bg-danger/10"
      >
        <span aria-hidden>×</span>
      </button>
    </div>
  )
}

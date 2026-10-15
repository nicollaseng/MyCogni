'use client'

import { useTranslations } from 'next-intl'
import type { SaveStatus } from './use-autosave'

interface SaveIndicatorProps {
  status: SaveStatus
  uploading: boolean
  onRetry: () => void
}

export function SaveIndicator({ status, uploading, onRetry }: SaveIndicatorProps) {
  const t = useTranslations('mybook.editor.status')

  function message() {
    if (uploading) {
      return t('uploading')
    }
    switch (status) {
      case 'idle':
      case 'outdated':
        return null
      case 'pending':
      case 'saving':
        return t('saving')
      case 'saved':
        return t('saved')
      case 'failed':
        return (
          <span className="flex items-center gap-2 text-danger">
            {t('failed')}
            <button
              type="button"
              onClick={onRetry}
              className="font-medium underline decoration-1 underline-offset-4"
            >
              {t('retry')}
            </button>
          </span>
        )
    }
  }

  return (
    <p role="status" className="min-w-0 text-right text-sm text-muted-foreground">
      {message()}
    </p>
  )
}

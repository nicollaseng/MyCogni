'use client'

import { useTranslations } from 'next-intl'
import { useSyncExternalStore } from 'react'
import { isAppOutdated, subscribeToOutdatedApp } from '@/shared/lib/actions/outdated'
import { ReloadNotice } from './reload-notice'

export function OutdatedAppNotice() {
  const t = useTranslations('common.outdated')
  const outdated = useSyncExternalStore(subscribeToOutdatedApp, isAppOutdated, () => false)

  if (!outdated) {
    return null
  }
  return (
    <div className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[60] px-3">
      <ReloadNotice
        message={t('message')}
        className="mx-auto max-w-md bg-background shadow-[0_0_0_1px_var(--rule),0_4px_14px_rgb(0_0_0/0.08)]"
      />
    </div>
  )
}

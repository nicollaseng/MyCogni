'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

interface ReloadNoticeProps {
  message: string
  className?: string
}

export function ReloadNotice({ message, className }: ReloadNoticeProps) {
  const t = useTranslations('common.outdated')

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-[8px] bg-surface py-3 pr-3 pl-4',
        className,
      )}
    >
      <p className="text-[15px] leading-relaxed text-pretty">{message}</p>
      <Button
        size="sm"
        onClick={() => {
          window.location.reload()
        }}
      >
        {t('reload')}
      </Button>
    </div>
  )
}

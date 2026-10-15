'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/shared/ui/button'

type CopyState = 'idle' | 'copied' | 'failed'

export function CopyLinkButton({ link }: { link: string }) {
  const t = useTranslations('professional.invites')
  const [state, setState] = useState<CopyState>('idle')

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setState('copied')
    } catch {
      setState('failed')
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        shape="pill"
        onClick={() => {
          void copy()
        }}
      >
        {state === 'copied' ? t('copied') : t('copy')}
      </Button>
      <span role="status" className="sr-only">
        {state === 'copied' ? t('copied') : ''}
      </span>
      {state === 'failed' && (
        <p role="alert" className="basis-full text-sm text-danger">
          {t('copyFailed')}
        </p>
      )}
    </>
  )
}

export function InvitationLink({ link }: { link: string }) {
  const t = useTranslations('professional.invites')
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        readOnly
        value={link}
        aria-label={t('link')}
        onFocus={(event) => {
          event.currentTarget.select()
        }}
        className="h-10 min-w-0 flex-1 basis-56 rounded-[6px] border border-rule bg-white/60 px-3 text-sm text-muted-foreground outline-none focus:border-foreground focus:text-foreground dark:bg-white/5"
      />
      <CopyLinkButton key={link} link={link} />
    </div>
  )
}

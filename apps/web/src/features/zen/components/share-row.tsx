'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { ChatIcon, LinkIcon, MailIcon, ShareIcon } from '@/shared/components/icons'
import { mailtoHref, whatsappHref } from '../share'

export interface ShareRowProps {
  title: string
  lead: string
  teaser: string
  url: string
}

const copiedForMs = 2000

const action =
  'inline-flex size-10 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-sage hover:text-foreground motion-reduce:transition-none'

function subscribeToNothing(): () => void {
  return () => undefined
}

function useCanShare(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => typeof navigator.share === 'function',
    () => false,
  )
}

export function ShareRow({ title, lead, teaser, url }: ShareRowProps) {
  const t = useTranslations('zen.share')
  const canShare = useCanShare()
  const [copied, setCopied] = useState(false)
  const message = t('message', { title, lead: teaser, url })

  useEffect(() => {
    if (!copied) {
      return undefined
    }
    const timer = setTimeout(() => {
      setCopied(false)
    }, copiedForMs)
    return () => {
      clearTimeout(timer)
    }
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  async function shareNatively() {
    try {
      await navigator.share({ title, text: teaser, url })
    } catch {
      return
    }
  }

  return (
    <div className="flex items-center gap-1">
      <span className="pr-1 text-sm text-muted-foreground">{t('label')}</span>
      <a
        href={whatsappHref(message)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('whatsapp')}
        title={t('whatsapp')}
        className={action}
      >
        <ChatIcon className="size-5" />
      </a>
      <a
        href={mailtoHref(title, t('emailBody', { lead, url }))}
        aria-label={t('email')}
        title={t('email')}
        className={action}
      >
        <MailIcon className="size-5" />
      </a>
      <button
        type="button"
        onClick={() => {
          void copy()
        }}
        aria-label={t('copy')}
        title={t('copy')}
        className={action}
      >
        <LinkIcon className="size-5" />
      </button>
      {canShare && (
        <button
          type="button"
          onClick={() => {
            void shareNatively()
          }}
          aria-label={t('more')}
          title={t('more')}
          className={action}
        >
          <ShareIcon className="size-5" />
        </button>
      )}
      <span role="status" className="pl-1 text-sm text-muted-foreground">
        {copied ? t('copied') : ''}
      </span>
    </div>
  )
}

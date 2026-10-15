'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCallback, useRef, useState } from 'react'
import { ActionError } from '@/shared/components/action-error'
import { Button } from '@/shared/ui/button'
import { Icon } from '../components/icon'
import { useDismiss } from '../components/use-dismiss'

interface PageMenuProps {
  entryId: string
  deleting: boolean
  error: string | null
  onShare: () => void
  onDelete: () => void
}

const item =
  'flex w-full items-center rounded-[6px] px-3 py-2.5 text-left text-[15px] transition-colors duration-150 hover:bg-sage motion-reduce:transition-none'

export function PageMenu({ entryId, deleting, error, onShare, onDelete }: PageMenuProps) {
  const t = useTranslations('mybook.editor.menu')
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const close = useCallback(() => {
    setOpen(false)
    setConfirming(false)
  }, [])
  useDismiss(container, open && !deleting, close)

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        aria-label={t('open')}
        aria-expanded={open}
        onClick={() => {
          if (open) {
            close()
          } else {
            setOpen(true)
          }
        }}
        className="inline-flex size-10 items-center justify-center rounded-[6px] text-foreground transition-colors duration-150 hover:bg-sage aria-expanded:bg-sage motion-reduce:transition-none"
      >
        <Icon name="more" />
      </button>
      {open && (
        <div className="absolute top-full right-0 z-30 mt-2 w-72 rounded-[8px] bg-background p-1.5 shadow-[0_4px_14px_rgb(0_0_0/0.08)] ring-1 ring-rule">
          {confirming || error !== null ? (
            <div className="space-y-3 p-2.5">
              <p className="leading-relaxed text-pretty">{t('confirm')}</p>
              <ActionError error={error} />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={deleting}
                  onClick={onDelete}
                  className="bg-danger text-background hover:bg-danger/90"
                >
                  {deleting ? t('deleting') : t('confirmDelete')}
                </Button>
                <Button size="sm" variant="ghost" disabled={deleting} onClick={close}>
                  {t('cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <ul>
              <li>
                <Link
                  href={`/mybook/sharing?page=${entryId}`}
                  onClick={(event) => {
                    event.preventDefault()
                    onShare()
                  }}
                  className={item}
                >
                  {t('share')}
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(true)
                  }}
                  className={`${item} text-danger`}
                >
                  {t('delete')}
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

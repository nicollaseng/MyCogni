'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useState, type ChangeEvent } from 'react'
import { ClientPortal } from '@/shared/components/client-portal'
import { useModalPanel } from '@/shared/hooks/use-modal-panel'
import { cn } from '@/shared/lib/utils'
import type { PhotoFeedback } from '../use-photo-editing'

export const viewerMotion = 200

const barButton =
  'inline-flex h-11 shrink-0 cursor-pointer items-center rounded-md px-3 text-[15px] font-medium text-white/90 transition-colors duration-150 hover:bg-white/10 hover:text-white disabled:cursor-default disabled:opacity-50 motion-reduce:transition-none'

const fileTypes = 'image/jpeg,image/png,image/webp'

interface RemoveConfirmProps {
  onCancel: () => void
  onConfirm: () => void
}

function RemoveConfirm({ onCancel, onConfirm }: RemoveConfirmProps) {
  const t = useTranslations('account.photoViewer')
  const titleId = useId()
  const { panel, closing, close, onKeyDown } = useModalPanel<HTMLDivElement>(onCancel, 150)

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-6">
      <div
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={(event) => {
          event.stopPropagation()
          onKeyDown(event)
        }}
        className={cn(
          'w-full max-w-sm space-y-5 rounded-[8px] bg-background p-6 text-foreground outline-none transition-[opacity,scale] duration-150 starting:scale-[0.98] starting:opacity-0 motion-reduce:transition-none',
          closing && 'scale-[0.98] opacity-0',
        )}
      >
        <h2 id={titleId} className="text-[17px] font-medium">
          {t('confirmTitle')}
        </h2>
        <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
          {t('confirmBody')}
        </p>
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={close}
            className="inline-flex h-10 cursor-pointer items-center rounded-md border border-rule px-4 text-[15px] hover:bg-sage"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              close()
            }}
            className="inline-flex h-10 cursor-pointer items-center rounded-md bg-danger px-4 text-[15px] font-medium text-background hover:bg-danger/90"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

interface PhotoViewerProps {
  url: string | null
  initials: string
  alt: string
  busy: 'uploading' | 'removing' | null
  feedback: PhotoFeedback
  onClose: () => void
  onChoose: (event: ChangeEvent<HTMLInputElement>) => void
  onAdjust: () => void
  onRemove: () => void
}

export function PhotoViewer({
  url,
  initials,
  alt,
  busy,
  feedback,
  onClose,
  onChoose,
  onAdjust,
  onRemove,
}: PhotoViewerProps) {
  const t = useTranslations('account')
  const titleId = useId()
  const [confirming, setConfirming] = useState(false)
  const { panel, closing, close, onKeyDown } = useModalPanel<HTMLDivElement>(onClose, viewerMotion)

  useEffect(() => {
    if (document.activeElement === document.body) {
      panel.current?.focus()
    }
  })

  const status =
    busy === 'uploading'
      ? t('avatar.uploading')
      : busy === 'removing'
        ? t('avatar.removing')
        : (feedback?.text ?? '')

  return (
    <ClientPortal>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cn(
          'fixed inset-0 z-50 flex flex-col bg-[#0d1311] text-white outline-none transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none',
          closing && 'opacity-0',
        )}
      >
        <header className="flex shrink-0 items-center gap-1 px-2 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2 sm:px-4">
          <button
            type="button"
            onClick={close}
            aria-label={t('photoViewer.close')}
            className={barButton}
          >
            <span aria-hidden className="text-[22px] leading-none">
              ←
            </span>
          </button>
          <h2 id={titleId} className="min-w-0 flex-1 truncate px-1 text-[17px] font-medium">
            {t('photoViewer.title')}
          </h2>
          {url !== null && (
            <>
              <button
                type="button"
                onClick={onAdjust}
                disabled={busy !== null}
                className={barButton}
              >
                {t('photoViewer.edit')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(true)
                }}
                disabled={busy !== null}
                className={barButton}
              >
                {t('photoViewer.remove')}
              </button>
            </>
          )}
        </header>
        <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-10">
          {url !== null ? (
            <Image
              src={url}
              alt={alt}
              width={1024}
              height={1024}
              unoptimized
              className="h-auto max-h-full w-full max-w-[min(36rem,100%)] object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-8">
              <span
                aria-hidden
                className="grid size-44 place-items-center rounded-full bg-white/10 font-serif text-[56px] leading-none"
              >
                {initials}
              </span>
              <label className="inline-flex h-11 cursor-pointer items-center rounded-md bg-white px-5 text-[15px] font-medium text-[#0d1311] transition-colors hover:bg-white/90 has-disabled:cursor-default has-disabled:opacity-60">
                <input
                  type="file"
                  accept={fileTypes}
                  className="sr-only"
                  disabled={busy !== null}
                  onChange={onChoose}
                />
                {t('photoViewer.add')}
              </label>
            </div>
          )}
        </div>
        <p
          aria-live="polite"
          className={cn(
            'min-h-10 shrink-0 px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] text-center text-sm',
            feedback?.kind === 'error' ? 'text-red-200' : 'text-white/75',
          )}
        >
          {status}
        </p>
        {confirming && (
          <RemoveConfirm
            onCancel={() => {
              setConfirming(false)
            }}
            onConfirm={onRemove}
          />
        )}
      </div>
    </ClientPortal>
  )
}

'use client'

import { isCaptionText } from '@mycogni/domain'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ClientPortal } from '@/shared/components/client-portal'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { useModalPanel } from '@/shared/hooks/use-modal-panel'
import { cn } from '@/shared/lib/utils'
import { Icon, type IconName } from '../components/icon'

export const viewerMotion = 200

const swipeDistance = 48

export interface ViewerPhoto {
  key: string
  src: string | null
  caption: string
  context?: string
}

export interface ViewerActions {
  download: (photo: ViewerPhoto, index: number) => Promise<boolean>
  saveCaption: (photo: ViewerPhoto, caption: string) => Promise<boolean>
  remove: (photo: ViewerPhoto) => Promise<boolean>
  openPage?: (photo: ViewerPhoto) => void
}

interface PhotoViewerProps {
  photos: readonly ViewerPhoto[]
  start: string
  actions: ViewerActions | null
  onClose: (last: string | null) => void
}

type Status = 'downloadError' | 'saveError' | null

const iconButton =
  'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-white/90 transition-colors duration-150 hover:bg-white/10 hover:text-white disabled:cursor-default disabled:opacity-50 motion-reduce:transition-none'

const textButton =
  'inline-flex h-10 shrink-0 cursor-pointer items-center rounded-md px-3 text-[15px] font-medium transition-colors duration-150 motion-reduce:transition-none'

function BarButton({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: IconName
  label: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onPress}
      className={iconButton}
    >
      <Icon name={icon} />
    </button>
  )
}

export function PhotoViewer({ photos, start, actions, onClose }: PhotoViewerProps) {
  const t = useTranslations('mybook.viewer')
  const titleId = useId()
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      photos.findIndex((p) => p.key === start),
    ),
  )
  const [editing, setEditing] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  const swipe = useRef<number | null>(null)
  const shownIndex = Math.min(index, photos.length - 1)
  const photo = photos[shownIndex]
  const { panel, closing, close, onKeyDown } = useModalPanel<HTMLDivElement>(() => {
    onClose(photo?.key ?? null)
  }, viewerMotion)

  function stopEditing() {
    setEditing(null)
    panel.current?.focus()
  }

  function move(step: number) {
    if (editing !== null) {
      return
    }
    setStatus(null)
    setIndex(Math.min(photos.length - 1, Math.max(0, shownIndex + step)))
  }

  useEffect(() => {
    if (confirming) {
      return
    }
    function closeFromOutside(event: globalThis.KeyboardEvent) {
      const inside = event.target instanceof Node && panel.current?.contains(event.target)
      if (event.key === 'Escape' && inside !== true) {
        close()
      }
    }
    document.addEventListener('keydown', closeFromOutside)
    return () => {
      document.removeEventListener('keydown', closeFromOutside)
    }
  }, [confirming, close, panel])

  async function run(task: () => Promise<boolean>, failure: Status): Promise<boolean> {
    setBusy(true)
    setStatus(null)
    const done = await task()
    setBusy(false)
    if (!done) {
      setStatus(failure)
    }
    if (
      !(document.activeElement instanceof HTMLElement) ||
      document.activeElement === document.body
    ) {
      panel.current?.focus()
    }
    return done
  }

  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (editing === null && event.key === 'ArrowRight') {
      move(1)
      return
    }
    if (editing === null && event.key === 'ArrowLeft') {
      move(-1)
      return
    }
    onKeyDown(event)
  }

  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    swipe.current = event.clientX
  }

  function endSwipe(event: PointerEvent<HTMLDivElement>) {
    const from = swipe.current
    swipe.current = null
    if (from === null || Math.abs(event.clientX - from) < swipeDistance) {
      return
    }
    move(event.clientX < from ? 1 : -1)
  }

  if (photo === undefined) {
    return null
  }

  const captionValid = editing === null || isCaptionText(editing.trim())

  return (
    <ClientPortal>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeys}
        className={cn(
          'fixed inset-0 z-50 flex flex-col bg-[#0d1311] text-white outline-none transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none',
          closing && 'opacity-0',
        )}
      >
        <header className="flex shrink-0 items-center gap-1 px-2 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2 sm:px-4">
          <BarButton icon="close" label={t('close')} onPress={close} />
          <h2 id={titleId} className="min-w-0 flex-1 truncate px-1 text-[15px] tabular-nums">
            <span className="sr-only">{t('photo')} </span>
            {t('position', { current: shownIndex + 1, total: photos.length })}
          </h2>
          {actions !== null && (
            <>
              {actions.openPage !== undefined && (
                <button
                  type="button"
                  onClick={() => {
                    actions.openPage?.(photo)
                  }}
                  className={cn(textButton, 'text-white/90 hover:bg-white/10')}
                >
                  {t('openPage')}
                </button>
              )}
              <BarButton
                icon="download"
                label={t('download')}
                disabled={busy || photo.src === null}
                onPress={() => {
                  void run(() => actions.download(photo, shownIndex), 'downloadError')
                }}
              />
              <BarButton
                icon="edit"
                label={t('editCaption')}
                disabled={busy}
                onPress={() => {
                  setEditing(photo.caption)
                }}
              />
              <BarButton
                icon="trash"
                label={t('remove')}
                disabled={busy}
                onPress={() => {
                  setConfirming(true)
                }}
              />
            </>
          )}
        </header>
        <div
          onPointerDown={startSwipe}
          onPointerUp={endSwipe}
          onPointerCancel={() => {
            swipe.current = null
          }}
          className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-4"
        >
          {photo.src !== null && (
            <div className="relative h-full w-full max-w-[min(64rem,100%)]">
              <Image
                key={photo.key}
                src={photo.src}
                alt={photo.caption === '' ? t('photoAlt') : photo.caption}
                fill
                unoptimized
                sizes="100vw"
                draggable={false}
                className="pointer-events-none object-contain select-none"
              />
            </div>
          )}
          {shownIndex > 0 && (
            <div className="absolute inset-y-0 left-2 hidden items-center sm:flex">
              <BarButton
                icon="back"
                label={t('previous')}
                onPress={() => {
                  move(-1)
                }}
              />
            </div>
          )}
          {shownIndex < photos.length - 1 && (
            <div className="absolute inset-y-0 right-2 hidden items-center sm:flex">
              <BarButton
                icon="forward"
                label={t('next')}
                onPress={() => {
                  move(1)
                }}
              />
            </div>
          )}
        </div>
        <footer className="mx-auto w-full max-w-xl shrink-0 space-y-1.5 px-6 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] text-center">
          {photo.context !== undefined && <p className="text-sm text-white/60">{photo.context}</p>}
          {editing === null ? (
            photo.caption !== '' && (
              <p className="text-[15px] leading-relaxed text-pretty whitespace-pre-line text-white/90">
                {photo.caption}
              </p>
            )
          ) : (
            <form
              className="space-y-2 text-left"
              onSubmit={(event) => {
                event.preventDefault()
                const caption = editing.trim()
                void run(
                  () => actions?.saveCaption(photo, caption) ?? Promise.resolve(false),
                  'saveError',
                ).then((done) => {
                  if (done) {
                    stopEditing()
                  }
                })
              }}
            >
              <label className="block text-sm text-white/70">
                {t('captionLabel')}
                <textarea
                  value={editing}
                  maxLength={500}
                  rows={2}
                  autoFocus
                  placeholder={t('captionPlaceholder')}
                  aria-invalid={!captionValid}
                  onChange={(event) => {
                    setEditing(event.target.value)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      event.stopPropagation()
                      stopEditing()
                    }
                  }}
                  className="mt-1 block w-full resize-none rounded-md bg-white/10 px-3 py-2 text-[16px] text-white outline-none placeholder:text-white/50 focus-visible:outline-2 focus-visible:outline-white/70"
                />
              </label>
              {!captionValid && <p className="text-sm text-red-200">{t('captionInvalid')}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopEditing()
                  }}
                  className={cn(textButton, 'text-white/90 hover:bg-white/10')}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={busy || !captionValid}
                  className={cn(
                    textButton,
                    'bg-white text-[#0d1311] hover:bg-white/90 disabled:opacity-60',
                  )}
                >
                  {t('save')}
                </button>
              </div>
            </form>
          )}
          <p aria-live="polite" className="min-h-5 text-sm text-red-200">
            {status === null ? '' : t(status)}
          </p>
        </footer>
        {confirming && actions !== null && (
          <ConfirmDialog
            title={t('confirmTitle')}
            body={t('confirmBody')}
            cancelLabel={t('cancel')}
            confirmLabel={t('confirm')}
            onCancel={() => {
              setConfirming(false)
            }}
            onConfirm={() => {
              const last = photos.length === 1
              void run(() => actions.remove(photo), 'saveError').then((done) => {
                if (done && last) {
                  close()
                }
              })
            }}
          />
        )}
      </div>
    </ClientPortal>
  )
}

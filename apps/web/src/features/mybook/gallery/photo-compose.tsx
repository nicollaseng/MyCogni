'use client'

import { isCaptionText, journalLimits, type JournalPhotoSize } from '@mycogni/domain'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState } from 'react'
import { ClientPortal } from '@/shared/components/client-portal'
import { useKeyboardInset } from '@/shared/hooks/use-keyboard-inset'
import { useModalPanel } from '@/shared/hooks/use-modal-panel'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { cn } from '@/shared/lib/utils'
import { Icon } from '../components/icon'
import type { PhotoTools } from '../editor/photo-canvas'
import { rememberedPhotoSize, rememberPhotoSize } from '../editor/photo-size-choice'
import type { ComposedPhoto } from '../editor/photos'
import type { ChosenPhoto } from '../editor/use-page-photos'
import {
  isHighQuality,
  originalProblemOf,
  QualityChoice,
  readAll,
  type Reading,
} from './photo-quality'
import { viewerMotion } from './photo-viewer'

interface PhotoComposeProps {
  photos: readonly ChosenPhoto[]
  tools: PhotoTools
  onAdd: (photos: readonly ComposedPhoto[], size: JournalPhotoSize) => void
  onClose: () => void
}

interface Chosen {
  photos: readonly ComposedPhoto[]
  size: JournalPhotoSize
}

export function PhotoCompose({ photos, tools, onAdd, onClose }: PhotoComposeProps) {
  const t = useTranslations('mybook.compose')
  const sheet = useTranslations('mybook.editor.photoSheet')
  const titleId = useId()
  const captionId = useId()
  const keyboard = useKeyboardInset()
  const reducedMotion = usePrefersReducedMotion()
  const chosen = useRef<Chosen | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const settling = useRef<number | null>(null)
  const [output] = useState(tools.outputType)
  const [reading, setReading] = useState<Reading | null>(null)
  const [preferred, setPreferred] = useState<JournalPhotoSize>(rememberedPhotoSize)
  const [quality, setQuality] = useState(false)
  const [index, setIndex] = useState(0)
  const [captions, setCaptions] = useState<readonly string[]>(() => photos.map(() => ''))
  const { panel, closing, close, onKeyDown } = useModalPanel<HTMLDivElement>(() => {
    onClose()
    if (chosen.current !== null) {
      onAdd(chosen.current.photos, chosen.current.size)
    }
  }, viewerMotion)
  const size = preferred === 'original' && originalProblemOf(photos) !== null ? 'high' : preferred
  const caption = captions[index] ?? ''
  const allValid = captions.every((text) => isCaptionText(text.trim()))
  const ready = reading?.ready ?? []

  useEffect(() => {
    let active = true
    void readAll(photos, tools).then((result) => {
      if (active) {
        setReading(result)
      }
    })
    return () => {
      active = false
    }
  }, [photos, tools])

  function show(next: number) {
    setIndex(next)
    const view = scroller.current
    if (view === null || view.scrollLeft === next * view.clientWidth) {
      return
    }
    settling.current = next
    view.scrollTo({ left: next * view.clientWidth, behavior: reducedMotion ? 'instant' : 'smooth' })
  }

  function send() {
    rememberPhotoSize(size)
    chosen.current = {
      size,
      photos: ready.map((photo) => {
        const position = photos.findIndex((candidate) => candidate.file === photo.file)
        return { ...photo, caption: (captions[position] ?? '').trim() }
      }),
    }
    close()
  }

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
        <header className="relative flex shrink-0 items-center gap-1 px-2 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2 sm:px-4">
          <button
            type="button"
            onClick={close}
            aria-label={t('cancel')}
            title={t('cancel')}
            className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-white/90 hover:bg-white/10"
          >
            <Icon name="close" />
          </button>
          <h2 id={titleId} className="min-w-0 flex-1 truncate px-1 text-[15px]">
            {sheet('title', { count: photos.length })}
          </h2>
          <button
            type="button"
            aria-expanded={quality}
            aria-pressed={isHighQuality(size)}
            aria-label={t('quality', { size: sheet(`sizes.${size}`) })}
            onClick={() => {
              setQuality((open) => !open)
            }}
            className="inline-flex h-9 shrink-0 cursor-pointer items-center rounded-md border border-white/35 px-2.5 text-[13px] font-semibold tracking-wide text-white/80 aria-pressed:border-white aria-pressed:bg-white aria-pressed:text-[#0d1311]"
          >
            HD
          </button>
          {quality && (
            <div className="absolute top-full right-2 z-10 w-[min(20rem,calc(100vw-1rem))] rounded-[8px] bg-[#1b2421] p-3 text-white shadow-[0_8px_24px_rgb(0_0_0/0.4)] sm:right-4">
              <QualityChoice
                photos={photos}
                reading={reading}
                output={output}
                size={size}
                onChoose={(option) => {
                  setPreferred(option)
                  setQuality(false)
                }}
              />
            </div>
          )}
        </header>
        <div
          ref={scroller}
          onScroll={(event) => {
            const view = event.currentTarget
            const width = Math.max(1, view.clientWidth)
            const next = Math.round(view.scrollLeft / width)
            if (settling.current !== null) {
              if (Math.abs(view.scrollLeft - settling.current * width) < 2) {
                settling.current = null
              }
              return
            }
            if (next !== index && photos[next] !== undefined) {
              setIndex(next)
            }
          }}
          className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((photo, position) => (
            <div key={photo.preview} className="relative h-full w-full shrink-0 snap-center px-4">
              <div className="relative h-full w-full">
                <Image
                  src={photo.preview}
                  alt={t('preview', { current: position + 1, total: photos.length })}
                  fill
                  unoptimized
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
            </div>
          ))}
        </div>
        <div
          className="mx-auto w-full max-w-xl shrink-0 space-y-3 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
          style={keyboard > 0 ? { paddingBottom: keyboard + 12 } : undefined}
        >
          {photos.length > 1 && (
            <div
              role="group"
              aria-label={t('strip')}
              className="-m-1 flex gap-1.5 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {photos.map((photo, position) => (
                <button
                  key={photo.preview}
                  type="button"
                  aria-pressed={position === index}
                  aria-label={t('preview', { current: position + 1, total: photos.length })}
                  onClick={() => {
                    show(position)
                  }}
                  className="relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-[6px] opacity-60 after:pointer-events-none after:absolute after:inset-0 after:rounded-[6px] after:content-[''] aria-pressed:opacity-100 aria-pressed:after:ring-2 aria-pressed:after:ring-white aria-pressed:after:ring-inset"
                >
                  <Image
                    src={photo.preview}
                    alt=""
                    fill
                    unoptimized
                    sizes="3rem"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          {reading?.problem != null && (
            <p role="alert" className="text-sm leading-relaxed text-red-200">
              {sheet(reading.problem)}
            </p>
          )}
          {!allValid && <p className="text-sm text-red-200">{t('captionInvalid')}</p>}
          <div className="flex items-end gap-2">
            <label htmlFor={captionId} className="sr-only">
              {t('captionLabel', { current: index + 1, total: photos.length })}
            </label>
            <textarea
              id={captionId}
              value={caption}
              rows={1}
              maxLength={journalLimits.caption}
              placeholder={t('captionPlaceholder')}
              onChange={(event) => {
                const text = event.target.value
                setCaptions((all) =>
                  all.map((value, position) => (position === index ? text : value)),
                )
              }}
              className="max-h-32 min-h-12 flex-1 resize-none rounded-[8px] bg-white/10 px-3.5 py-3 text-[16px] leading-snug text-white outline-none [field-sizing:content] placeholder:text-white/55 focus-visible:outline-2 focus-visible:outline-white/70"
            />
            <button
              type="button"
              aria-label={sheet('add')}
              title={sheet('add')}
              disabled={ready.length === 0 || !allValid}
              onClick={send}
              className="mb-1 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#cfe0cb] text-[#142019] transition-opacity disabled:cursor-default disabled:opacity-50 motion-reduce:transition-none"
            >
              <Icon name="send" className="size-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </ClientPortal>
  )
}

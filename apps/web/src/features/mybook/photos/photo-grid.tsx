'use client'

import type { JournalPhoto, JournalPhotoPage } from '@mycogni/contracts'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { SafetyNotice } from '@/features/safety/components/safety-notice'
import type { SafetyPrompt } from '@/features/safety/model'
import type { ActionResult } from '@/shared/lib/actions/result'
import { formatShortDate } from '@/shared/lib/time'
import { formatMonth } from '../dates'
import { downloadPhoto, photoFileName } from '../gallery/download'
import { PhotoViewer, type ViewerActions, type ViewerPhoto } from '../gallery/photo-viewer'
import { photoHash } from '../gallery/use-photo-hash'
import { usePhotoViewing } from '../gallery/use-photo-viewing'
import { mergePhotos, photoKey, photosByMonth, type PhotoChange } from './model'

interface PhotoGridProps {
  initial: JournalPhotoPage
  timeZone: string
  load: (offset: number) => Promise<ActionResult<JournalPhotoPage>>
  change: (
    entryId: string,
    path: string,
    change: PhotoChange,
  ) => Promise<ActionResult<SafetyPrompt | null>>
}

export function PhotoGrid({ initial, timeZone, load, change }: PhotoGridProps) {
  const t = useTranslations('mybook.photoGrid')
  const book = useTranslations('mybook')
  const locale = useLocale()
  const router = useRouter()
  const viewing = usePhotoViewing()
  const [photos, setPhotos] = useState<readonly JournalPhoto[]>(initial.photos)
  const [nextOffset, setNextOffset] = useState(initial.nextOffset)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [safety, setSafety] = useState<SafetyPrompt | null>(null)
  const more = useRef<HTMLButtonElement>(null)
  const now = new Date()

  async function loadMore() {
    if (nextOffset === null || loading) {
      return
    }
    setLoading(true)
    setError(null)
    const result = await load(nextOffset)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setPhotos((current) => mergePhotos(current, result.value.photos))
    setNextOffset(result.value.nextOffset)
  }

  const loadRef = useRef(loadMore)
  useEffect(() => {
    loadRef.current = loadMore
  })

  useEffect(() => {
    const button = more.current
    if (button === null || typeof IntersectionObserver !== 'function') {
      return
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void loadRef.current()
      }
    })
    observer.observe(button)
    return () => {
      observer.disconnect()
    }
  }, [nextOffset])

  function find(key: string): JournalPhoto | undefined {
    return photos.find((photo) => photoKey(photo) === key)
  }

  async function apply(key: string, edit: PhotoChange): Promise<boolean> {
    const photo = find(key)
    if (photo === undefined) {
      return false
    }
    const result = await change(photo.entryId, photo.path, edit)
    if (!result.ok) {
      return false
    }
    setSafety(result.value)
    if (edit.kind === 'remove') {
      setPhotos((current) => current.filter((item) => photoKey(item) !== key))
      setNextOffset((offset) => (offset === null ? null : offset - 1))
    } else {
      setPhotos((current) =>
        current.map((item) => (photoKey(item) === key ? { ...item, caption: edit.caption } : item)),
      )
    }
    return true
  }

  const actions: ViewerActions = {
    download: (shown) => {
      const photo = find(shown.key)
      return photo?.url == null
        ? Promise.resolve(false)
        : downloadPhoto(photo.url, (type) =>
            photoFileName(new Date(photo.writtenAt), timeZone, photo.position, photo.path, type),
          )
    },
    saveCaption: (shown, caption) => apply(shown.key, { kind: 'caption', caption }),
    remove: (shown) => apply(shown.key, { kind: 'remove' }),
    openPage: (shown) => {
      const photo = find(shown.key)
      if (photo !== undefined) {
        router.push(`/mybook/${photo.entryId}${photoHash(photo.path)}`)
      }
    },
  }

  const shown: ViewerPhoto[] = photos.map((photo) => ({
    key: photoKey(photo),
    src: photo.url,
    caption: photo.caption,
    context: `${formatShortDate(new Date(photo.writtenAt), timeZone, locale)} · ${photo.entryTitle ?? book('untitled')}`,
  }))

  if (photos.length === 0 && nextOffset === null) {
    return <p className="px-1 text-muted-foreground">{t('empty')}</p>
  }

  return (
    <div className="space-y-6">
      {safety !== null && <SafetyNotice prompt={safety} />}
      <section aria-label={t('grid')} className="space-y-6">
        {photosByMonth(photos, timeZone).map((month) => (
          <div key={month.key} className="space-y-2">
            <h2 className="px-1 text-sm font-medium text-muted-foreground">
              {formatMonth(month.date, now, timeZone, locale)}
            </h2>
            <ul className="grid grid-cols-3 gap-0.5 sm:grid-cols-5 lg:grid-cols-6">
              {month.photos.map((photo) => (
                <li key={photoKey(photo)}>
                  <button
                    type="button"
                    data-photo-tile={photoKey(photo)}
                    aria-label={
                      photo.caption === ''
                        ? t('tile', {
                            date: formatShortDate(new Date(photo.writtenAt), timeZone, locale),
                          })
                        : photo.caption
                    }
                    onClick={() => {
                      viewing.actions.open(photoKey(photo))
                    }}
                    className="relative block aspect-square w-full cursor-pointer overflow-hidden bg-surface outline-offset-2"
                  >
                    {photo.url !== null && (
                      <Image
                        src={photo.url}
                        alt=""
                        fill
                        unoptimized
                        sizes="(min-width: 64rem) 8rem, (min-width: 40rem) 20vw, 33vw"
                        className="object-cover"
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      {error !== null && (
        <p role="alert" className="px-1 text-sm text-danger">
          {error}
        </p>
      )}
      {nextOffset !== null && (
        <button
          ref={more}
          type="button"
          disabled={loading}
          onClick={() => {
            void loadMore()
          }}
          className="inline-flex h-10 cursor-pointer items-center rounded-md px-1 text-sm underline decoration-1 underline-offset-4 disabled:cursor-default disabled:opacity-60"
        >
          {loading ? t('loading') : t('loadMore')}
        </button>
      )}
      {viewing.viewing !== null && (
        <PhotoViewer
          photos={shown}
          start={viewing.viewing}
          actions={actions}
          onClose={viewing.close}
        />
      )}
    </div>
  )
}

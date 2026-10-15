'use client'

import {
  approximatePhotoSize,
  isHeicPhoto,
  journalLimits,
  journalPhotoLongestSide,
  journalPhotoSizes,
  originalPhotoProblem,
  planJournalPhoto,
  type JournalPhotoOutputType,
  type JournalPhotoSize,
  type OriginalPhotoProblem,
} from '@mycogni/domain'
import Image from 'next/image'
import { useFormatter, useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState } from 'react'
import { Sheet } from '@/shared/components/sheet'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import type { PhotoTools } from './photo-canvas'
import { rememberedPhotoSize, rememberPhotoSize } from './photo-size-choice'
import type { ReadyPhoto } from './photos'
import type { ChosenPhoto } from './use-page-photos'

interface PhotoSizeSheetProps {
  photos: readonly ChosenPhoto[]
  tools: PhotoTools
  onAdd: (photos: readonly ReadyPhoto[], size: JournalPhotoSize) => void
  onClose: () => void
}

type ReadProblem = 'heic' | 'unreadable'

interface Reading {
  ready: readonly ReadyPhoto[]
  problem: ReadProblem | null
}

interface Total {
  bytes: number
  exact: boolean
}

const previewLimit = 4

const megabyte = 1024 * 1024

async function readAll(photos: readonly ChosenPhoto[], tools: PhotoTools): Promise<Reading> {
  const ready: ReadyPhoto[] = []
  let problem: ReadProblem | null = null
  for (const { file } of photos) {
    try {
      ready.push({ file, ...(await tools.read(file)) })
    } catch {
      problem = isHeicPhoto(file) ? 'heic' : (problem ?? 'unreadable')
    }
  }
  return { ready, problem }
}

function originalProblemOf(photos: readonly ChosenPhoto[]): OriginalPhotoProblem | null {
  const problems = photos.map(({ file }) => originalPhotoProblem(file))
  return (
    problems.find((problem) => problem === 'format') ?? problems.find((p) => p !== null) ?? null
  )
}

function totalOf(
  ready: readonly ReadyPhoto[],
  size: JournalPhotoSize,
  output: JournalPhotoOutputType,
): Total {
  return ready.reduce<Total>(
    (total, photo) => {
      const plan = planJournalPhoto(
        { ...photo, bytes: photo.file.size, type: photo.file.type },
        size,
        output,
      )
      return plan.kind === 'unavailable'
        ? total
        : { bytes: total.bytes + plan.bytes, exact: total.exact && plan.kind === 'keep' }
    },
    { bytes: 0, exact: true },
  )
}

function Previews({ photos }: { photos: readonly ChosenPhoto[] }) {
  const t = useTranslations('mybook.editor.photoSheet')
  const [first] = photos
  if (photos.length === 1 && first !== undefined) {
    return (
      <Image
        src={first.preview}
        alt={t('preview')}
        width={0}
        height={0}
        unoptimized
        className="mx-auto block h-auto max-h-[min(34dvh,22rem)] w-auto max-w-full rounded-[6px] bg-surface"
      />
    )
  }
  const hidden = photos.length - previewLimit
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1.5">
        {photos.slice(0, previewLimit).map((photo) => (
          <div
            key={photo.preview}
            className="relative aspect-square overflow-hidden rounded-[4px] bg-surface"
          >
            <Image
              src={photo.preview}
              alt={t('preview')}
              fill
              unoptimized
              sizes="7rem"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {hidden > 0 && (
        <p className="text-sm text-muted-foreground">{t('more', { count: hidden })}</p>
      )}
    </div>
  )
}

function SizeChoice({
  photos,
  tools,
  onAdd,
  onCancel,
}: Omit<PhotoSizeSheetProps, 'onClose'> & { onCancel: () => void }) {
  const t = useTranslations('mybook.editor.photoSheet')
  const format = useFormatter()
  const id = useId()
  const [output] = useState(tools.outputType)
  const [reading, setReading] = useState<Reading | null>(null)
  const [chosen, setChosen] = useState<JournalPhotoSize>(rememberedPhotoSize)
  const originalProblem = originalProblemOf(photos)
  const size = chosen === 'original' && originalProblem !== null ? 'high' : chosen
  const ready = reading?.ready ?? []

  useEffect(() => {
    let current = true
    void readAll(photos, tools).then((result) => {
      if (current) {
        setReading(result)
      }
    })
    return () => {
      current = false
    }
  }, [photos, tools])

  function sizeText(bytes: number): string {
    const { amount, unit } = approximatePhotoSize(bytes)
    return format.number(amount, { style: 'unit', unit, maximumFractionDigits: 1 })
  }

  function hintOf(option: JournalPhotoSize): string {
    if (option !== 'original') {
      return t('hints.resized', { pixels: String(journalPhotoLongestSide[option]) })
    }
    if (originalProblem === 'tooLarge') {
      return t('hints.originalTooLarge', { max: String(journalLimits.imageBytes / megabyte) })
    }
    return originalProblem === 'format' ? t('hints.originalFormat') : t('hints.original')
  }

  function estimateOf(option: JournalPhotoSize): string {
    if (option === 'original') {
      return sizeText(photos.reduce((bytes, { file }) => bytes + file.size, 0))
    }
    if (reading === null) {
      return t('reading')
    }
    const total = totalOf(ready, option, output)
    return total.exact ? sizeText(total.bytes) : t('estimate', { size: sizeText(total.bytes) })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 pb-6 sm:px-6">
        <Previews photos={photos} />
        <fieldset className="min-w-0">
          <legend className="mb-2 text-sm font-medium">{t('legend')}</legend>
          <div className="space-y-0.5">
            {journalPhotoSizes.map((option) => {
              const unavailable = option === 'original' && originalProblem !== null
              return (
                <label
                  key={option}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 py-2.5',
                    unavailable && 'cursor-default',
                  )}
                >
                  <input
                    type="radio"
                    name={`${id}-size`}
                    checked={size === option}
                    disabled={unavailable}
                    onChange={() => {
                      setChosen(option)
                    }}
                    className="mt-1 size-4 shrink-0 accent-primary"
                  />
                  <span className="flex min-w-0 flex-1 items-baseline justify-between gap-4">
                    <span className="min-w-0">
                      <span className={cn('block', unavailable && 'text-muted-foreground')}>
                        {t(`sizes.${option}`)}
                      </span>
                      <span className="block text-sm text-muted-foreground">{hintOf(option)}</span>
                    </span>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {estimateOf(option)}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
        {reading?.problem != null && (
          <p role="alert" className="text-sm leading-relaxed text-danger">
            {t(reading.problem)}
          </p>
        )}
      </div>
      <div className="flex shrink-0 justify-end gap-2.5 border-t border-rule px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6">
        <Button variant="outline" size="sm" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button
          size="sm"
          disabled={ready.length === 0}
          onClick={() => {
            rememberPhotoSize(size)
            onAdd(ready, size)
          }}
        >
          {t('add')}
        </Button>
      </div>
    </div>
  )
}

export function PhotoSizeSheet({ photos, tools, onAdd, onClose }: PhotoSizeSheetProps) {
  const t = useTranslations('mybook.editor.photoSheet')
  const chosen = useRef<{ ready: readonly ReadyPhoto[]; size: JournalPhotoSize } | null>(null)

  return (
    <Sheet
      title={t('title', { count: photos.length })}
      closeLabel={t('close')}
      onClose={() => {
        onClose()
        if (chosen.current !== null) {
          onAdd(chosen.current.ready, chosen.current.size)
        }
      }}
    >
      {(close) => (
        <SizeChoice
          photos={photos}
          tools={tools}
          onCancel={close}
          onAdd={(ready, size) => {
            chosen.current = { ready, size }
            close()
          }}
        />
      )}
    </Sheet>
  )
}

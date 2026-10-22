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
import { useFormatter, useTranslations } from 'next-intl'
import { useId } from 'react'
import { cn } from '@/shared/lib/utils'
import type { PhotoTools } from '../editor/photo-canvas'
import type { ReadyPhoto } from '../editor/photos'
import type { ChosenPhoto } from '../editor/use-page-photos'

export type ReadProblem = 'heic' | 'unreadable'

export interface Reading {
  ready: readonly ReadyPhoto[]
  problem: ReadProblem | null
}

interface Total {
  bytes: number
  exact: boolean
}

const megabyte = 1024 * 1024

export async function readAll(photos: readonly ChosenPhoto[], tools: PhotoTools): Promise<Reading> {
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

export function originalProblemOf(photos: readonly ChosenPhoto[]): OriginalPhotoProblem | null {
  const problems = photos.map(({ file }) => originalPhotoProblem(file))
  return (
    problems.find((problem) => problem === 'format') ?? problems.find((p) => p !== null) ?? null
  )
}

export function isHighQuality(size: JournalPhotoSize): boolean {
  return size === 'high' || size === 'original'
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

interface QualityChoiceProps {
  photos: readonly ChosenPhoto[]
  reading: Reading | null
  output: JournalPhotoOutputType
  size: JournalPhotoSize
  onChoose: (size: JournalPhotoSize) => void
}

export function QualityChoice({ photos, reading, output, size, onChoose }: QualityChoiceProps) {
  const t = useTranslations('mybook.editor.photoSheet')
  const format = useFormatter()
  const id = useId()
  const originalProblem = originalProblemOf(photos)

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
    const total = totalOf(reading.ready, option, output)
    return total.exact ? sizeText(total.bytes) : t('estimate', { size: sizeText(total.bytes) })
  }

  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-sm font-medium">{t('legend')}</legend>
      <div className="space-y-0.5">
        {journalPhotoSizes.map((option) => {
          const unavailable = option === 'original' && originalProblem !== null
          return (
            <label
              key={option}
              className={cn(
                'flex cursor-pointer items-start gap-3 py-2',
                unavailable && 'cursor-default',
              )}
            >
              <input
                type="radio"
                name={`${id}-size`}
                checked={size === option}
                disabled={unavailable}
                onChange={() => {
                  onChoose(option)
                }}
                className="mt-1 size-4 shrink-0 accent-primary"
              />
              <span className="flex min-w-0 flex-1 items-baseline justify-between gap-4">
                <span className="min-w-0">
                  <span className={cn('block', unavailable && 'opacity-60')}>
                    {t(`sizes.${option}`)}
                  </span>
                  <span className="block text-sm opacity-70">{hintOf(option)}</span>
                </span>
                <span className="shrink-0 text-sm opacity-70">{estimateOf(option)}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

import type { JournalPhoto } from '@mycogni/contracts'
import { dayKey } from '@mycogni/domain'

export const photoBatch = 30

export type PhotoChange = { kind: 'caption'; caption: string } | { kind: 'remove' }

export interface PhotoMonth {
  key: string
  date: Date
  photos: JournalPhoto[]
}

export function photoKey(photo: Pick<JournalPhoto, 'entryId' | 'path'>): string {
  return `${photo.entryId}:${photo.path}`
}

export function photosByMonth(photos: readonly JournalPhoto[], timeZone: string): PhotoMonth[] {
  return photos.reduce<PhotoMonth[]>((months, photo) => {
    const date = new Date(photo.writtenAt)
    const key = dayKey(date, timeZone).slice(0, 7)
    const last = months.at(-1)
    if (last?.key === key) {
      return [...months.slice(0, -1), { ...last, photos: [...last.photos, photo] }]
    }
    return [...months, { key, date, photos: [photo] }]
  }, [])
}

export function mergePhotos(
  current: readonly JournalPhoto[],
  incoming: readonly JournalPhoto[],
): JournalPhoto[] {
  const known = new Set(current.map(photoKey))
  return [...current, ...incoming.filter((photo) => !known.has(photoKey(photo)))]
}

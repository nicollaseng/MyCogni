import type {
  JournalEntry,
  JournalEntryPage,
  JournalEntrySummary,
  JournalShare,
} from '@mycogni/contracts'
import { excerptOf, isShareActive } from '@mycogni/domain'
import type { RecordPage } from '../../db/paging.ts'
import type { JournalImageStore } from '../../storage/journal-images.ts'
import type {
  JournalEntryRecord,
  JournalEntrySummaryRecord,
  JournalShareRecord,
} from './journal.repository.ts'

function toSummary(record: JournalEntrySummaryRecord): JournalEntrySummary {
  return {
    id: record.id,
    title: record.title,
    excerpt: excerptOf(record.preview),
    imageCount: record.imageCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export function toSummaryPage(
  { records, total, page }: RecordPage<JournalEntrySummaryRecord>,
  size: number,
): JournalEntryPage {
  return { items: records.map(toSummary), total, page, size }
}

export async function toEntry(
  record: JournalEntryRecord,
  images: JournalImageStore,
): Promise<JournalEntry> {
  return {
    id: record.id,
    title: record.title,
    body: record.body,
    plainText: record.plainText,
    imagePaths: record.imagePaths,
    imageUrls: await images.sign(record.imagePaths),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export function toShare(record: JournalShareRecord, now: Date): JournalShare {
  return {
    ...record,
    expiresAt: record.expiresAt?.toISOString() ?? null,
    revokedAt: record.revokedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    lastAccessAt: record.lastAccessAt?.toISOString() ?? null,
    active: isShareActive(record, now),
  }
}

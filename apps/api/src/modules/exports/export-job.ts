import { dataExportLimits, exportExpiry, isLocale, type Locale } from '@mycogni/domain'
import type { Mailer } from '../../mail/mailer.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import { writeArchive, type ArchiveFiles } from './export-archive.ts'
import type { ExportCollector } from './export-collector.ts'
import { exportCopies } from './export-copy.ts'
import { exportReadyEmail } from './export-email.ts'
import type { DataExportRepository } from './export.repository.ts'

export type ExportRunResult =
  { kind: 'skipped' } | { kind: 'ready'; size: number } | { kind: 'failed'; reason: string }

export interface ExportNotifier {
  ready(userId: string): Promise<void>
  failed(userId: string): Promise<void>
}

export interface DataExportJob {
  run(exportId: string): Promise<ExportRunResult>
  sweep(): Promise<{ expired: number; failed: number }>
}

export interface DataExportJobDependencies {
  exports: DataExportRepository
  collector: ExportCollector
  files: ArchiveFiles
  store: Pick<BucketStore, 'uploadFile' | 'remove'>
  notifier: ExportNotifier
  mailer: Mailer
  webUrl: string
  log: { error(details: object, message: string): void }
  now: () => Date
}

const fallbackLocale: Locale = 'pt-BR'

const hourInMilliseconds = 60 * 60 * 1000

export const dataPagePath = '/me/privacy#data'

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.name : 'Error'
}

export function createDataExportJob({
  exports,
  collector,
  files,
  store,
  notifier,
  mailer,
  webUrl,
  log,
  now,
}: DataExportJobDependencies): DataExportJob {
  return {
    async run(exportId) {
      const record = await exports.start(exportId)
      if (record === undefined) {
        return { kind: 'skipped' }
      }
      try {
        const data = await collector.collect(record.userId)
        const locale = isLocale(data.profile.locale) ? data.profile.locale : fallbackLocale
        const archive = await writeArchive({
          data,
          copy: exportCopies[locale],
          locale,
          exportedAt: now(),
          files,
        })
        try {
          const storagePath = `${record.userId}/${record.id}.zip`
          await store.uploadFile(storagePath, archive.file, archive.size, 'application/zip')
          const readyAt = now()
          await exports.finish(record.id, {
            storagePath,
            sizeBytes: archive.size,
            readyAt,
            expiresAt: exportExpiry(readyAt),
          })
        } finally {
          await archive.dispose()
        }
        await notifier.ready(record.userId)
        if (data.account.email !== null) {
          await mailer.send(
            exportReadyEmail(data.account.email, locale, `${webUrl}${dataPagePath}`),
          )
        }
        return { kind: 'ready', size: archive.size }
      } catch (error) {
        const reason = reasonOf(error)
        log.error({ exportId, reason }, 'Data export failed')
        await exports.fail(record.id, reason)
        await notifier.failed(record.userId)
        return { kind: 'failed', reason }
      }
    },
    async sweep() {
      const moment = now()
      const expiring = await exports.expiring(moment)
      for (const record of expiring) {
        if (record.storagePath !== null) {
          await store.remove([record.storagePath])
        }
        await exports.expire(record.id)
      }
      const stalled = await exports.stalled(
        new Date(moment.getTime() - dataExportLimits.staleHours * hourInMilliseconds),
      )
      for (const record of stalled) {
        await exports.fail(record.id, 'Stalled')
        await notifier.failed(record.userId)
      }
      return { expired: expiring.length, failed: stalled.length }
    },
  }
}

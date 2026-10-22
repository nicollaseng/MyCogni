import type { DataExport, DataExportDownload, LatestDataExport } from '@mycogni/contracts'
import { dataExportLimits, isDownloadable } from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import type { JobScheduler } from '../../jobs/scheduler.ts'
import { ConflictError, NotFoundError, TooManyRequestsError } from '../../shared/errors.ts'
import type { RateLimiter } from '../../shared/rate-limiter.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import type { DataExportRecord, DataExportRepository } from './export.repository.ts'

export interface DataExportService {
  request(user: AuthenticatedUser): Promise<{ export: DataExport; created: boolean }>
  latest(user: AuthenticatedUser): Promise<LatestDataExport>
  download(user: AuthenticatedUser, id: string): Promise<DataExportDownload>
}

interface DataExportDependencies {
  repository: DataExportRepository
  store: Pick<BucketStore, 'sign'>
  jobs: Pick<JobScheduler, 'exportRequested'>
  limiter: RateLimiter
  now: () => Date
}

const dayInSeconds = 24 * 60 * 60

export function toDataExport(record: DataExportRecord): DataExport {
  return {
    id: record.id,
    status: record.status,
    requestedAt: record.requestedAt.toISOString(),
    readyAt: record.readyAt?.toISOString() ?? null,
    expiresAt: record.expiresAt?.toISOString() ?? null,
    sizeBytes: record.sizeBytes,
  }
}

export function downloadName(record: Pick<DataExportRecord, 'readyAt'>): string {
  return `mycogniai-dados-${(record.readyAt ?? new Date()).toISOString().slice(0, 10)}.zip`
}

export function createDataExportService({
  repository,
  store,
  jobs,
  limiter,
  now,
}: DataExportDependencies): DataExportService {
  return {
    async request(user) {
      const latest = await repository.latest(user.id)
      if (latest?.status === 'queued' || latest?.status === 'running') {
        return { export: toDataExport(latest), created: false }
      }
      const allowed = await limiter.consume(`exports:${user.id}`, {
        limit: dataExportLimits.requestsPerDay,
        windowSeconds: dayInSeconds,
      })
      if (!allowed) {
        throw new TooManyRequestsError(
          'EXPORT_LIMIT',
          'You can prepare your data up to 3 times a day',
        )
      }
      const { record, created } = await repository.request(user.id)
      if (created) {
        await jobs.exportRequested(record.id)
      }
      return { export: toDataExport(record), created }
    },
    async latest(user) {
      const record = await repository.latest(user.id)
      return { export: record === undefined ? null : toDataExport(record) }
    },
    async download(user, id) {
      const record = await repository.find(user.id, id)
      if (record === undefined) {
        throw new NotFoundError('Export not found')
      }
      if (!isDownloadable(record, now()) || record.storagePath === null) {
        throw new ConflictError('This export is not ready to download')
      }
      const url = (await store.sign([record.storagePath]))[record.storagePath]
      if (url === undefined) {
        throw new NotFoundError('Export not found')
      }
      return { url: `${url}&download=${encodeURIComponent(downloadName(record))}` }
    },
  }
}

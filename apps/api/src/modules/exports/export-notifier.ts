import type { Database } from '../../db/client.ts'
import { notifications } from '../../db/schema/index.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import type { ArchiveFiles } from './export-archive.ts'
import type { ExportNotifier } from './export-job.ts'

export function createExportNotifier(db: Database): ExportNotifier {
  return {
    async ready(userId) {
      await db.insert(notifications).values({ userId, kind: 'export_ready' })
    },
    async failed(userId) {
      await db.insert(notifications).values({ userId, kind: 'export_failed' })
    },
  }
}

export function archiveFilesOf(stores: {
  journal: BucketStore
  avatar: BucketStore
  documents: BucketStore
}): ArchiveFiles {
  return {
    open(source, path) {
      return stores[source].open(path)
    },
  }
}

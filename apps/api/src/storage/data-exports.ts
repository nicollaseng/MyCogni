import { dataExportLimits } from '@mycogni/domain'
import { createBucketStore, type BucketStore } from './bucket-store.ts'

export const dataExportBucket = 'exports'

export function createDataExportStore(supabaseUrl: string, secretKey: string): BucketStore {
  return createBucketStore({
    supabaseUrl,
    secretKey,
    bucket: dataExportBucket,
    links: { kind: 'expiring', lifetimeSeconds: dataExportLimits.downloadSeconds },
  })
}

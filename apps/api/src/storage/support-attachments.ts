import { supportAttachmentBucket } from '@mycogni/domain'
import { createBucketStore, type BucketStore } from './bucket-store.ts'
import { documentLinkLifetimeSeconds } from './profile-files.ts'

export function createSupportAttachmentStore(supabaseUrl: string, secretKey: string): BucketStore {
  return createBucketStore({
    supabaseUrl,
    secretKey,
    bucket: supportAttachmentBucket,
    lifetimeSeconds: documentLinkLifetimeSeconds,
  })
}

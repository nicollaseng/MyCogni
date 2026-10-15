import { journalBucket } from '@mycogni/domain'
import { createBucketStore, stableLinks, type BucketStore } from './bucket-store.ts'

export type JournalImageStore = BucketStore

export function createJournalImageStore(supabaseUrl: string, secretKey: string): JournalImageStore {
  return createBucketStore({ supabaseUrl, secretKey, bucket: journalBucket, links: stableLinks() })
}

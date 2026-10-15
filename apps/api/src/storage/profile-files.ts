import { avatarBucket, professionalDocumentBucket } from '@mycogni/domain'
import { createBucketStore, type BucketStore } from './bucket-store.ts'

export const documentLinkLifetimeSeconds = 5 * 60

export interface ProfileFileStores {
  photos: BucketStore
  documents: BucketStore
}

export function createProfileFileStores(supabaseUrl: string, secretKey: string): ProfileFileStores {
  return {
    photos: createBucketStore({
      supabaseUrl,
      secretKey,
      bucket: avatarBucket,
      lifetimeSeconds: 3600,
    }),
    documents: createBucketStore({
      supabaseUrl,
      secretKey,
      bucket: professionalDocumentBucket,
      lifetimeSeconds: documentLinkLifetimeSeconds,
    }),
  }
}

export async function signedUrlOf(store: BucketStore, path: string | null): Promise<string | null> {
  if (path === null) {
    return null
  }
  return (await store.sign([path]))[path] ?? null
}

import { avatarBucket, professionalDocumentBucket } from '@mycogni/domain'
import { createBucketStore, stableLinks, type BucketStore } from './bucket-store.ts'

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
      links: stableLinks(),
    }),
    documents: createBucketStore({
      supabaseUrl,
      secretKey,
      bucket: professionalDocumentBucket,
      links: { kind: 'expiring', lifetimeSeconds: documentLinkLifetimeSeconds },
    }),
  }
}

export async function signedUrlOf(store: BucketStore, path: string | null): Promise<string | null> {
  if (path === null) {
    return null
  }
  return (await store.sign([path]))[path] ?? null
}

import { avatarBucket } from '@mycogni/domain'
import { cache } from 'react'
import { fetchProfile } from './api/resources'
import { createSupabaseServerClient } from './supabase/server'

const lifetimeSeconds = 60 * 60

export async function ownPhotoUrl(path: string | null): Promise<string | null> {
  if (path === null) {
    return null
  }
  const supabase = await createSupabaseServerClient('read-only')
  const { data } = await supabase.storage.from(avatarBucket).createSignedUrl(path, lifetimeSeconds)
  return data?.signedUrl ?? null
}

export const fetchMyPhotoUrl = cache(async (): Promise<string | null> =>
  ownPhotoUrl((await fetchProfile()).avatarPath),
)

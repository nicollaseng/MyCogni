import { avatarBucket, createSignedLinkCache, signedLinkWindow } from '@mycogni/domain'
import { cache } from 'react'
import { fetchProfile } from './api/resources'
import { createSupabaseServerClient } from './supabase/server'

const links = createSignedLinkCache(1000)

export async function ownPhotoUrl(path: string | null): Promise<string | null> {
  if (path === null) {
    return null
  }
  const window = signedLinkWindow(new Date())
  const known = links.read(path, window)
  if (known !== undefined) {
    return known
  }
  const supabase = await createSupabaseServerClient('read-only')
  const { data } = await supabase.storage.from(avatarBucket).createSignedUrl(path, window.expiresIn)
  if (data === null) {
    return null
  }
  links.write(path, data.signedUrl, window)
  return data.signedUrl
}

export const fetchMyPhotoUrl = cache(async (): Promise<string | null> =>
  ownPhotoUrl((await fetchProfile()).avatarPath),
)

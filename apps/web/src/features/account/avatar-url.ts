import { createSupabaseServerClient } from '@/shared/lib/supabase/server'
import { avatarBucket } from './avatar'

export async function avatarUrl(path: string | null): Promise<string | null> {
  if (path === null) {
    return null
  }
  const supabase = await createSupabaseServerClient('read-only')
  const { data } = await supabase.storage.from(avatarBucket).createSignedUrl(path, 60 * 60)
  return data?.signedUrl ?? null
}

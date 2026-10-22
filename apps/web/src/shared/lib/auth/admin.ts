import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../supabase/server'
import { isAdminRole } from './roles'
import { requireUser, type SessionUser } from './session'

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  const supabase = await createSupabaseServerClient('read-only')
  const { data } = await supabase.auth.getUser()
  if (data.user?.id !== user.id || !isAdminRole(data.user.app_metadata)) {
    redirect('/')
  }
  return user
}

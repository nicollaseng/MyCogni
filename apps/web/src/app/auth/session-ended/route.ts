import { createSupabaseServerClient } from '@/shared/lib/supabase/server'
import { siteRedirect } from '@/shared/lib/site-redirect'

export async function GET() {
  const supabase = await createSupabaseServerClient('read-write')
  await supabase.auth.signOut({ scope: 'local' })
  return siteRedirect('/sign-in?error=session')
}

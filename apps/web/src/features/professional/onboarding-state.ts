import { createSupabaseServerClient } from '@/shared/lib/supabase/server'
import { photoStepDoneIn } from './onboarding'

export async function hasFinishedPhotoStep(): Promise<boolean> {
  const supabase = await createSupabaseServerClient('read-only')
  const { data } = await supabase.auth.getUser()
  return photoStepDoneIn(data.user?.user_metadata)
}

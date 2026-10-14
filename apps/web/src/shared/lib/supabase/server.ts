import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { publicEnv } from '../env'

export type CookieAccess = 'read-only' | 'read-write'

export async function createSupabaseServerClient(access: CookieAccess) {
  const cookieStore = await cookies()
  const { supabaseUrl, supabaseKey } = publicEnv()

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        if (access === 'read-only') {
          return
        }
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options)
        }
      },
    },
  })
}

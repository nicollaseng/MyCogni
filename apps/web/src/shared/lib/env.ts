import { z } from 'zod'

const publicSchema = z.object({
  supabaseUrl: z.url(),
  supabaseKey: z.string().min(1),
  googleAuthEnabled: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
})

const serverSchema = z.object({
  siteUrl: z.url().transform((value) => value.replace(/\/+$/, '')),
})

export type PublicEnv = z.output<typeof publicSchema>

export type ServerEnv = z.output<typeof serverSchema>

export function publicEnv(): PublicEnv {
  return publicSchema.parse({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    googleAuthEnabled: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED,
  })
}

export function serverEnv(): ServerEnv {
  return serverSchema.parse({ siteUrl: process.env.SITE_URL })
}

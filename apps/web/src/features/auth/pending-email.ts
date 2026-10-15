import { cookies } from 'next/headers'

const cookieName = 'mycogni_pending_email'
const sentCookieName = 'mycogni_code_sent_at'
const oneHour = 60 * 60

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: oneHour,
  path: '/',
} as const

export async function rememberPendingEmail(email: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(cookieName, email, cookieOptions)
}

export async function pendingEmail(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(cookieName)?.value ?? null
}

export async function rememberCodeSent(at: number = Date.now()): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(sentCookieName, String(at), cookieOptions)
}

export async function codeSentAt(): Promise<number | null> {
  const cookieStore = await cookies()
  const value = Number(cookieStore.get(sentCookieName)?.value)
  return Number.isFinite(value) && value > 0 ? value : null
}

export interface CodeTiming {
  sentAt: number | null
  now: number
}

export async function codeTiming(): Promise<CodeTiming> {
  return { sentAt: await codeSentAt(), now: Date.now() }
}

export async function forgetPendingEmail(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(cookieName)
  cookieStore.delete(sentCookieName)
}

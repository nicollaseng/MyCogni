import { cookies } from 'next/headers'

const cookieName = 'mycogni_pending_email'
const oneHour = 60 * 60

export async function rememberPendingEmail(email: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(cookieName, email, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: oneHour,
    path: '/',
  })
}

export async function pendingEmail(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(cookieName)?.value ?? null
}

export async function forgetPendingEmail(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(cookieName)
}

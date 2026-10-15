import { cookies } from 'next/headers'

const continueCookie = 'MYCOGNI_CONTINUE'

const oneDay = 60 * 60 * 24

export type ContinueTarget = `/invite/${string}` | '/pro/join'

export function continueTargetOf(value: string): ContinueTarget | null {
  if (value === '/pro/join') {
    return '/pro/join'
  }
  const code = /^\/invite\/([23456789A-Z]{8})$/.exec(value)?.[1]
  return code === undefined ? null : `/invite/${code}`
}

export async function rememberContinuePath(path: string): Promise<void> {
  const target = continueTargetOf(path)
  if (target === null) {
    return
  }
  const store = await cookies()
  store.set(continueCookie, target, { path: '/', maxAge: oneDay, sameSite: 'lax', httpOnly: true })
}

export async function continuePath(): Promise<ContinueTarget | null> {
  const store = await cookies()
  const value = store.get(continueCookie)?.value
  return value === undefined ? null : continueTargetOf(value)
}

export async function forgetContinuePath(): Promise<void> {
  const store = await cookies()
  store.delete(continueCookie)
}

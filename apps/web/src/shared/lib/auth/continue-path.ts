import type { AccountType } from '@mycogni/domain'
import { cookies } from 'next/headers'

const continueCookie = 'MYCOGNI_CONTINUE'

const thirtyMinutes = 60 * 30

const professionalIntent = '/pro/join'

export type ContinueTarget = `/invite/${string}` | typeof professionalIntent

export function continueTargetOf(value: string): ContinueTarget | null {
  if (value === professionalIntent) {
    return professionalIntent
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
  store.set(continueCookie, target, {
    path: '/',
    maxAge: thirtyMinutes,
    sameSite: 'lax',
    httpOnly: true,
  })
}

export async function continuePath(): Promise<ContinueTarget | null> {
  const store = await cookies()
  const value = store.get(continueCookie)?.value
  return value === undefined ? null : continueTargetOf(value)
}

export async function forgetContinuePath(): Promise<void> {
  const store = await cookies()
  if (store.has(continueCookie)) {
    store.delete(continueCookie)
  }
}

export async function takeContinuePath(): Promise<ContinueTarget | null> {
  const target = await continuePath()
  await forgetContinuePath()
  return target
}

export async function rememberAccountIntent(type: AccountType): Promise<void> {
  if (type === 'professional') {
    await rememberContinuePath(professionalIntent)
  } else if ((await continuePath()) === professionalIntent) {
    await forgetContinuePath()
  }
}

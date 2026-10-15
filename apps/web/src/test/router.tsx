import { jest } from '@jest/globals'
import {
  AppRouterContext,
  type AppRouterInstance,
} from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { ReactNode } from 'react'

export function fakeRouter() {
  return {
    back: jest.fn<() => void>(),
    forward: jest.fn<() => void>(),
    refresh: jest.fn<() => void>(),
    push: jest.fn<(href: string) => void>(),
    replace: jest.fn<(href: string) => void>(),
    prefetch: jest.fn<(href: string) => void>(),
    bfcacheId: 'test',
  } satisfies AppRouterInstance
}

export function WithRouter({
  router,
  children,
}: {
  router: AppRouterInstance
  children: ReactNode
}) {
  return <AppRouterContext.Provider value={router}>{children}</AppRouterContext.Provider>
}

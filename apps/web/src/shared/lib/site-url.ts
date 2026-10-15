import { serverEnv } from './env'

export function sitePath(path: string): string {
  return path.startsWith('/') && !path.startsWith('//') ? path : '/'
}

export function siteUrlOf(path: string): URL {
  return new URL(sitePath(path), serverEnv().siteUrl)
}

import { avatarRenderSize } from './photos.ts'

const googlePhotoDomain = 'googleusercontent.com'

const httpsAddress = /^https:\/\/([a-z0-9.-]+)(\/[^?#\s]*)?(\?[^#\s]*)?(#\S*)?$/i

export function isGooglePhotoHost(hostname: string): boolean {
  return hostname === googlePhotoDomain || hostname.endsWith(`.${googlePhotoDomain}`)
}

function sizedSegment(segment: string, size: number): string {
  const options = `=s${String(size)}-c`
  if (segment.includes('=')) {
    return segment.replace(/=.*$/, options)
  }
  return segment.includes('.') ? segment : `${segment}${options}`
}

export function googlePhotoUrl(raw: string, size: number = avatarRenderSize): string | null {
  const [, host = '', path = '/', query = ''] = httpsAddress.exec(raw.trim()) ?? []
  const hostname = host.toLowerCase()
  if (!isGooglePhotoHost(hostname)) {
    return null
  }
  const cut = path.lastIndexOf('/') + 1
  return `https://${hostname}${path.slice(0, cut)}${sizedSegment(path.slice(cut), size)}${query}`
}

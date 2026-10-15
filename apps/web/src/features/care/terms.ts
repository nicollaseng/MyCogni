import type { CareLink } from '@mycogni/contracts'
import type { Route } from 'next'

export type TermsHref = Route | `/me/professionals/${string}/terms`

export function termsReviewHref(id: string): TermsHref {
  return `/me/professionals/${id}/terms`
}

export function termsNoticeHref(links: readonly CareLink[]): TermsHref | null {
  const outdated = links.filter((link) => link.termsOutdated)
  const [only] = outdated
  if (only === undefined) {
    return null
  }
  return outdated.length === 1 ? termsReviewHref(only.id) : '/me#professionals'
}

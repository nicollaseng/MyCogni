const emailLinkTypes = ['email', 'recovery'] as const

export type EmailLinkType = (typeof emailLinkTypes)[number]

export const emailLinkFailedPath = '/sign-in?error=link'

export function emailLinkTypeOf(value: string | null): EmailLinkType | null {
  return emailLinkTypes.find((type) => type === value) ?? null
}

export function emailLinkCallback(siteUrl: string, type: EmailLinkType): string {
  return `${siteUrl}/auth/callback?flow=${type}`
}

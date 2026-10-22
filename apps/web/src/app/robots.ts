import type { MetadataRoute } from 'next'

const privateAreas = [
  '/today',
  '/entries',
  '/mybook',
  '/patterns',
  '/zen',
  '/me',
  '/check-in',
  '/onboarding',
  '/accept-terms',
  '/questionnaires',
  '/notifications',
  '/support',
  '/invites',
  '/invite/',
  '/pro/',
  '/admin',
  '/auth/',
  '/continue',
  '/uploads/',
  '/sign-in',
  '/sign-up',
  '/verify',
  '/forgot-password',
  '/reset-password',
  '/new-password',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/articles/', '/pro/join', '/privacy', '/terms'],
        disallow: privateAreas,
      },
    ],
  }
}

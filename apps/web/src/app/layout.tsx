import type { Metadata, Viewport } from 'next'
import { Newsreader, Schibsted_Grotesk } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'
import { OutdatedAppNotice } from '@/shared/components/outdated-app-notice'
import { serverEnv } from '@/shared/lib/env'
import './globals.css'

const serif = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-newsreader',
  display: 'swap',
})

const sans = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--font-grotesk',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common.meta')
  return {
    metadataBase: new URL(serverEnv().siteUrl),
    title: { default: 'MyCogniAI', template: '%s · MyCogniAI' },
    description: t('description'),
    icons: {
      icon: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      apple: '/apple-touch-icon.png',
    },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eef1ea' },
    { media: '(prefers-color-scheme: dark)', color: '#121a17' },
  ],
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const locale = await getLocale()

  return (
    <html lang={locale} className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          {children}
          <OutdatedAppNotice />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

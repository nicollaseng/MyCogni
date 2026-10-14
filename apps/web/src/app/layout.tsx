import type { Metadata, Viewport } from 'next'
import { Newsreader, Schibsted_Grotesk } from 'next/font/google'
import type { ReactNode } from 'react'
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

export const metadata: Metadata = {
  title: { default: 'MyCogniAI', template: '%s · MyCogniAI' },
  description:
    'Diário de humor: um registro por dia e PHQ-9 e GAD-7 a cada duas semanas para ver como ansiedade e humor mudam.',
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

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  )
}

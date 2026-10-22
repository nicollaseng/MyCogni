import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MyCogniAI',
    short_name: 'MyCogniAI',
    description: 'Mood journal, Zen Space and Cogni.',
    start_url: '/today',
    scope: '/',
    display: 'standalone',
    background_color: '#eef1ea',
    theme_color: '#23423a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}

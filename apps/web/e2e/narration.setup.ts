import { fileURLToPath } from 'node:url'
import { test as setup } from '@playwright/test'
import { publishArticleNarration } from './support/narration'

setup('publishes a narration fixture for the sleep and mood article', async () => {
  await publishArticleNarration(
    'sleep-and-mood',
    fileURLToPath(new URL('./fixtures/narration.mp3', import.meta.url)),
  )
})

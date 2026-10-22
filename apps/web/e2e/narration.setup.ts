import { fileURLToPath } from 'node:url'
import { test as setup } from '@playwright/test'
import { publishArticleNarration, publishMeditationNarration } from './support/narration'

setup('publishes narration fixtures for the sleep article and the anxiety meditation', async () => {
  const fixture = fileURLToPath(new URL('./fixtures/narration.mp3', import.meta.url))
  await publishArticleNarration('sleep-and-mood', fixture)
  await publishMeditationNarration('anxiety', fixture)
})

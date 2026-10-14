import { expect, test as setup } from '@playwright/test'
import { finishOnboarding } from './support/api'
import { signedInState } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

setup('signs in a person who finished onboarding, once for the app tests', async ({ page }) => {
  const email = uniqueEmail('session')
  const password = 'sessao-e2e-2026'
  await createUser(email, password)
  await finishOnboarding(email, password)

  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL('/today')
  await page.context().storageState({ path: signedInState })
})

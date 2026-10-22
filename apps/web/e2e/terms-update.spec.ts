import { expect, test } from '@playwright/test'
import { finishOnboarding } from './support/api'
import { revertLegalConsents } from './support/memories'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'termos-2026'

test('asks a returning person to accept the updated terms once', async ({ page }) => {
  const email = uniqueEmail('termos')
  const id = await createUser(email, password)
  await finishOnboarding(email, password)
  await revertLegalConsents(id)

  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL('/accept-terms')
  await expect(page.getByRole('heading', { level: 1, name: 'Atualizamos os termos' })).toBeVisible()
  await page.goto('/me/memories')
  await expect(page).toHaveURL('/accept-terms')
  const accept = page.getByRole('button', { name: 'Aceitar e continuar' })
  await expect(accept).toBeDisabled()
  await page.getByRole('checkbox').check()
  await accept.click()

  await expect(page).toHaveURL('/today')
  await page.goto('/accept-terms')
  await expect(page).toHaveURL('/today')
})

test('lets a returning person leave without accepting', async ({ page }) => {
  const email = uniqueEmail('termos-sair')
  const id = await createUser(email, password)
  await finishOnboarding(email, password)
  await revertLegalConsents(id)

  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/accept-terms')

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL('/')
})

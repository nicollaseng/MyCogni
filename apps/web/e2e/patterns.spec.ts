import { expect, test } from '@playwright/test'
import { finishOnboarding, recordCheckIns } from './support/api'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

test('shows what repeats in the records, with friendly notes while data is short', async ({
  page,
}) => {
  const email = uniqueEmail('padroes')
  const password = 'padroes-2026'
  await createUser(email, password)
  await finishOnboarding(email, password)
  await recordCheckIns(
    email,
    password,
    Array.from({ length: 5 }, (_, index) => ({
      moodLevel: 2 + (index % 3),
      emotions: index < 3 ? ['anxiety'] : ['calm'],
      contexts: ['work'],
      note: null,
    })),
  )
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/today')

  await page
    .getByRole('navigation', { name: 'Navegação principal' })
    .getByRole('link', { name: 'Padrões' })
    .click()

  await expect(page).toHaveURL('/patterns')
  const consistency = page.getByRole('region', { name: 'Constância' })
  await expect(consistency).toContainText('1 de 30')
  await expect(consistency).toContainText('1 dia')
  await expect(page.getByRole('region', { name: 'Humor por dia da semana' })).toContainText(
    'Faltam 13 dias',
  )
  const frequent = page.getByRole('region', { name: 'O que mais aparece' })
  await expect(frequent).toContainText('ansiedade3 registros')
  await expect(frequent).toContainText('trabalho5 registros')
  await expect(page.getByRole('region', { name: 'Contextos e seus dias' })).toContainText(
    'Ainda não dá para comparar.',
  )
  await expect(page.getByRole('region', { name: 'Questionários ao longo do tempo' })).toContainText(
    'Último: 0 de 27, mínima.',
  )
})

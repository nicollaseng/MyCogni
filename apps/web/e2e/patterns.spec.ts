import { expect, test, type Page } from '@playwright/test'
import { finishOnboarding, recordCheckIns } from './support/api'
import { seedMoodHistory, seedScoreHistory } from './support/history'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'padroes-2026'

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/today')
}

test('starts small, with one list of what is still on the way', async ({ page }) => {
  const email = uniqueEmail('padroes')
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
  await signIn(page, email)

  await page
    .getByRole('navigation', { name: 'Navegação principal' })
    .getByRole('link', { name: 'Padrões' })
    .click()

  await expect(page).toHaveURL('/patterns')
  const summary = page.getByRole('region', { name: 'Em resumo' })
  await expect(summary).toContainText('1 de 30')
  await expect(summary).toContainText('Sequência atual: 1 dia')
  await expect(page.getByRole('region', { name: 'Emoções e contextos' })).toContainText(
    'ansiedade3 registros',
  )
  const upcoming = page.getByRole('region', { name: 'Em breve' })
  await expect(upcoming).toContainText('Dias da semana1 de 14 dias')
  await expect(upcoming).toContainText('O que acompanha seus dias1 de 8 dias')
  await expect(upcoming).toContainText('Ânimo e ansiedade1 de 2 respostas')
  await expect(page.getByRole('region', { name: 'Dias da semana' })).toHaveCount(0)
  await expect(page.getByText(/Não é um diagnóstico/)).toHaveCount(1)
})

test('reads two months of records and keeps every section on the chosen period', async ({
  page,
}) => {
  const email = uniqueEmail('padroes-ricos')
  const id = await createUser(email, password)
  await finishOnboarding(email, password)
  await seedMoodHistory(id, 60)
  await seedScoreHistory(id)
  await signIn(page, email)

  await page.goto('/patterns')
  const periods = page.getByRole('navigation', { name: 'Período' })
  await expect(periods.getByRole('link', { name: '30 dias' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.getByRole('region', { name: 'Em resumo' })).toContainText('de 30')
  await expect(
    page.getByRole('region', { name: 'O que acompanha seus dias melhores' }),
  ).toContainText('exercício')
  await expect(page.getByRole('region', { name: 'Dias da semana' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Em breve' })).toHaveCount(0)

  await periods.getByRole('link', { name: '7 dias' }).click()
  await expect(page).toHaveURL('/patterns?period=7')
  await expect(page.getByRole('region', { name: 'Em resumo' })).toContainText('de 7')
  await expect(page.getByRole('region', { name: 'Dias da semana' })).toHaveCount(0)

  await periods.getByRole('link', { name: '90 dias' }).click()
  await expect(page).toHaveURL('/patterns?period=90')
  await expect(page.getByRole('region', { name: 'Em resumo' })).toContainText('de 90')
  const questionnaires = page.getByRole('region', { name: 'Ânimo e ansiedade' })
  await expect(questionnaires).toContainText('Desânimo')
  await expect(questionnaires).not.toContainText(/PHQ|GAD|de 27/)
})

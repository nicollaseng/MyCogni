import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import {
  acceptInvitation,
  finishOnboarding,
  inviteByLink,
  rename,
  verifiedProfessional,
} from './support/api'
import { latestMail } from './support/mailpit'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'alertas-e2e-2026'

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/sign-in/)
}

async function answerPhq9WithRisk(page: Page): Promise<void> {
  await page.goto('/questionnaires')
  await page.getByRole('button', { name: 'Começar' }).click()
  const screen = [
    'Mais da metade dos dias',
    'Mais da metade dos dias',
    'Nenhuma vez',
    'Nenhuma vez',
  ]
  for (const [index, choice] of screen.entries()) {
    await expect(page.getByText(`Pergunta ${String(index + 1)} de 5`)).toBeVisible()
    await page.getByRole('button', { name: choice, exact: true }).click()
  }
  await page.getByRole('button', { name: 'Continuar' }).click()
  for (let index = 5; index <= 11; index++) {
    await expect(page.getByText(`Pergunta ${String(index)} de 11`)).toBeVisible()
    const choice = index === 11 ? 'Vários dias' : 'Mais da metade dos dias'
    await page.getByRole('button', { name: choice, exact: true }).click()
  }
  await expect(page.getByRole('heading', { name: 'Obrigado por contar.' })).toBeVisible()
}

test('a linked patient answers item 9 and the professional resolves the urgent alert', async ({
  page,
}) => {
  const suffix = randomUUID().slice(0, 6)
  const professionalEmail = uniqueEmail('pro')
  await verifiedProfessional(professionalEmail, password, `Helena Prado ${suffix}`)
  const patientEmail = uniqueEmail('patient')
  const patientName = `Marina Costa ${suffix}`
  await createUser(patientEmail, password)
  await finishOnboarding(patientEmail, password)
  await rename(patientEmail, password, patientName)
  const { code } = await inviteByLink(professionalEmail, password)
  await acceptInvitation(patientEmail, password, code)

  await signIn(page, patientEmail)
  await answerPhq9WithRisk(page)
  await page.context().clearCookies()

  await signIn(page, professionalEmail)
  await expect(page).toHaveURL('/pro')
  const overview = page.getByRole('region', { name: 'Alertas pendentes' })
  await expect(async () => {
    await page.reload()
    await expect(overview).toContainText('Item 9 do PHQ-9 positivo', { timeout: 1_000 })
  }).toPass({ timeout: 20_000 })
  await expect(overview).toContainText(patientName)

  await page.getByRole('link', { name: 'Alertas, 2 alertas pendentes' }).click()
  await expect(page).toHaveURL('/pro/alerts')
  await expect(page.getByRole('heading', { level: 1, name: 'Alertas' })).toBeVisible()
  const urgent = page.getByRole('row').filter({ hasText: 'Item 9 do PHQ-9 positivo' })
  await expect(urgent).toContainText(patientName)
  await expect(urgent).toContainText('Urgente')
  await expect(urgent).toContainText('Novo')
  await expect(
    page.getByRole('row').filter({ hasText: 'Questionário com resultado grave' }),
  ).toContainText('Atenção')

  await urgent.getByRole('link', { name: patientName }).click()
  await expect(page).toHaveURL(/\/pro\/patients\/[0-9a-f-]{36}$/)
  await expect(page.getByRole('heading', { level: 1, name: patientName })).toBeVisible()
  const pending = page.getByRole('region', { name: 'Alertas pendentes' })
  await pending
    .getByRole('button', { name: `Resolver: Item 9 do PHQ-9 positivo, ${patientName}` })
    .click()
  await expect(pending.getByText('Alerta resolvido.')).toBeVisible()
  await expect(pending).not.toContainText('Item 9 do PHQ-9 positivo')
  await expect(page.getByRole('link', { name: 'Alertas, 1 alerta pendente' })).toBeVisible()

  const mail = await latestMail(professionalEmail, /Alerta urgente no MyCogniAI/)
  expect(mail).toContain(`Marina precisa da sua atenção`)
  expect(mail).not.toContain('PHQ')
  expect(mail).not.toContain(suffix)
})

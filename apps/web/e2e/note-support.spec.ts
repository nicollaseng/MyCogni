import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import {
  acceptInvitation,
  finishOnboarding,
  inviteByLink,
  rename,
  verifiedProfessional,
} from './support/api'
import { pageBody, saveStatus } from './support/mybook'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'apoio-e2e-2026'

interface LinkedPair {
  suffix: string
  professionalEmail: string
  professionalName: string
  patientEmail: string
  patientName: string
}

async function linkedPair(): Promise<LinkedPair> {
  const suffix = randomUUID().slice(0, 6)
  const professionalEmail = uniqueEmail('pro-nota')
  const professionalName = `Helena Prado ${suffix}`
  await verifiedProfessional(professionalEmail, password, professionalName)
  const patientEmail = uniqueEmail('paciente-nota')
  const patientName = `Marina Costa ${suffix}`
  await createUser(patientEmail, password)
  await finishOnboarding(patientEmail, password)
  await rename(patientEmail, password, patientName)
  const { code } = await inviteByLink(professionalEmail, password)
  await acceptInvitation(patientEmail, password, code)
  return { suffix, professionalEmail, professionalName, patientEmail, patientName }
}

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/sign-in/)
}

async function checkIn(page: Page, note: string): Promise<void> {
  await page.goto('/check-in')
  await page.getByRole('slider', { name: 'Como você está agora?' }).fill('0')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Pular' }).click()
  await page.getByRole('textbox', { name: 'Nota sobre hoje' }).fill(note)
  await page.getByRole('button', { name: 'Registrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: /^Registrado às \d{2}:\d{2}\.$/ })).toBeVisible()
}

async function alertRow(page: Page, reason: string, patientName: string) {
  await page.goto('/pro/alerts')
  const row = page.getByRole('row').filter({ hasText: reason }).filter({ hasText: patientName })
  await expect(async () => {
    await page.reload()
    await expect(row).toBeVisible({ timeout: 1_000 })
  }).toPass({ timeout: 30_000 })
  return row
}

test('a note asking for help offers support and alerts the professional who can read it', async ({
  page,
}) => {
  const pair = await linkedPair()

  await signIn(page, pair.patientEmail)
  await checkIn(page, 'Vontade de morrer')

  const support = page.getByRole('region', { name: 'Apoio agora' })
  await expect(support).toContainText(
    'Você não precisa passar por isso sem apoio: fale com alguém agora.',
  )
  await expect(support.getByRole('link', { name: '188 CVV' })).toHaveAttribute('href', 'tel:188')
  await expect(support.getByRole('link', { name: '192 SAMU' })).toHaveAttribute('href', 'tel:192')
  await expect(support).toContainText(`${pair.professionalName} acompanha você.`)
  await support.getByRole('button', { name: 'Fechar apoio' }).click()
  await expect(page.getByRole('button', { name: 'Ajuda agora' })).toBeFocused()
  await expect(page.getByRole('link', { name: 'Ver meus dias' })).toBeVisible()
  await page.context().clearCookies()

  await signIn(page, pair.professionalEmail)
  const row = await alertRow(page, 'Nota com sinal de risco', pair.patientName)
  await expect(row).toContainText('Urgente')
  await row.getByRole('link', { name: /Nota com sinal de risco/ }).click()
  await expect(page).toHaveURL(/\/pro\/patients\/[0-9a-f-]{36}\/entries\/[0-9a-f-]{36}$/)
  await expect(page.getByText('Vontade de morrer')).toBeVisible()
})

test('a private page or a worrying note offers support without alerting the professional', async ({
  page,
}) => {
  const pair = await linkedPair()

  await signIn(page, pair.patientEmail)
  await page.goto('/mybook')
  await page.getByRole('button', { name: 'Nova página' }).click()
  await expect(page).toHaveURL(/\/mybook\/[0-9a-f-]{36}$/)
  await pageBody(page).click()
  await page.keyboard.type('Vontade de morrer')
  await expect(saveStatus(page)).toHaveText('Salvo')

  const support = page.getByRole('region', { name: 'Apoio agora' })
  await expect(support).toContainText(`${pair.professionalName} acompanha você.`)
  await expect(pageBody(page)).toBeFocused()
  await page.keyboard.type(' hoje')
  await expect(pageBody(page)).toContainText('Vontade de morrer hoje')
  await expect(saveStatus(page)).toHaveText('Salvo')

  await checkIn(page, 'Ando muito triste')
  await expect(page.getByRole('region', { name: 'Apoio agora' })).toContainText(
    'Se ficar pesado, tem gente pronta para ouvir você, a qualquer hora.',
  )
  await checkIn(page, 'Vontade de morrer')
  await page.context().clearCookies()

  await signIn(page, pair.professionalEmail)
  const risk = await alertRow(page, 'Nota com sinal de risco', pair.patientName)
  await expect(risk.getByRole('link', { name: /Nota com sinal de risco/ })).toHaveAttribute(
    'href',
    /\/pro\/patients\/[0-9a-f-]{36}\/entries\/[0-9a-f-]{36}$/,
  )
  await expect(
    page.getByRole('row').filter({ hasText: 'Nota' }).filter({ hasText: pair.patientName }),
  ).toHaveCount(1)
})

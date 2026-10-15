import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import { z } from 'zod'
import { finishOnboarding, inviteByLink, verifiedProfessional } from './support/api'
import { signedOut } from './support/session'
import { createUser, localSupabase, supabaseUrl, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'profissional-e2e-2026'
const apiUrl = process.env.API_URL ?? 'http://127.0.0.1:3333'

function uniqueName(name: string): string {
  return `${name} ${randomUUID().slice(0, 6)}`
}

async function signIn(page: Page, email: string) {
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

const sessionSchema = z.object({ access_token: z.string() })
const claimedSchema = z.object({ id: z.uuid() })

async function patientApi(email: string) {
  const session = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: localSupabase().PUBLISHABLE_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const authorization = `Bearer ${sessionSchema.parse(await session.json()).access_token}`
  return async function send(method: 'POST' | 'PATCH', path: string, body: unknown) {
    const response = await fetch(`${apiUrl}${path}`, {
      method,
      headers: { authorization, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      throw new Error(`${method} ${path} answered ${String(response.status)}`)
    }
    if (response.status === 204) {
      return null
    }
    const payload: unknown = await response.json()
    return payload
  }
}

async function linkedPatient(professionalEmail: string, name: string): Promise<void> {
  const email = uniqueEmail('patient')
  await createUser(email, password)
  await finishOnboarding(email, password)
  const send = await patientApi(email)
  await send('PATCH', '/v1/me', { displayName: name })
  const { code } = await inviteByLink(professionalEmail, password)
  const { id } = claimedSchema.parse(await send('POST', '/v1/invitations/claim', { code }))
  await send('POST', `/v1/invitations/${id}/accept`, {
    sharesHistory: false,
    consentVersion: '2026-10',
  })
  await send('POST', '/v1/check-ins', {
    moodLevel: 5,
    emotions: ['calm'],
    contexts: ['work'],
    note: 'Consegui caminhar antes do trabalho.',
  })
}

test('a verified professional lands on the patients, invites by link and cancels it', async ({
  page,
}) => {
  const email = uniqueEmail('pro')
  await verifiedProfessional(email, password, uniqueName('Helena Prado'))

  await page.goto('/sign-in')
  await signIn(page, email)

  await expect(page).toHaveURL('/pro')
  await expect(page.getByRole('heading', { level: 1, name: 'Pacientes' })).toBeVisible()
  await expect(page.getByText('Nenhum paciente por aqui ainda.')).toBeVisible()

  await page.getByRole('link', { name: 'Convidar paciente' }).click()
  await expect(page).toHaveURL('/pro/invites')
  await page.getByText('Por link', { exact: true }).click()
  await page.getByRole('button', { name: 'Criar link' }).click()

  await expect(
    page.getByText('Link criado. Copie e envie para a pessoa por onde preferir.'),
  ).toBeVisible()
  await expect(page.getByLabel('Link do convite')).toHaveValue(/\/invite\/[23456789A-Z]{8}$/)

  const sent = page.getByRole('listitem').filter({ hasText: 'Convite por link' })
  await expect(sent).toContainText('Aguardando resposta')
  await sent.getByRole('button', { name: 'Cancelar convite' }).click()

  await expect(page.getByText('Convite cancelado.')).toBeVisible()
  await expect(sent).toContainText('Cancelado')
  await expect(sent.getByRole('button')).toHaveCount(0)
})

test('a verified professional opens the file of a linked patient', async ({ page }) => {
  const email = uniqueEmail('pro')
  const patient = uniqueName('Marina Costa')
  await verifiedProfessional(email, password, uniqueName('Rafael Costa'))
  await linkedPatient(email, patient)

  await page.goto('/sign-in')
  await signIn(page, email)
  await expect(page).toHaveURL('/pro')

  const card = page.getByRole('listitem').filter({ hasText: patient })
  await expect(card).toContainText('1 registro')
  await expect(card).toContainText('Bem')
  await card.getByRole('link', { name: patient }).click()

  await expect(page).toHaveURL(/\/pro\/patients\/[0-9a-f-]{36}$/)
  await expect(page.getByRole('heading', { level: 1, name: patient })).toBeVisible()
  await expect(page.getByText('Você vê os registros feitos a partir do vínculo.')).toBeVisible()
  await expect(page.getByText('Consegui caminhar antes do trabalho.')).toBeVisible()

  await page.goto(`/pro/patients/${randomUUID()}`)
  await expect(page.getByRole('heading', { name: 'Esta página não existe.' })).toBeVisible()
})

test('a new professional signs in from the professional page and waits for verification', async ({
  page,
}) => {
  const email = uniqueEmail('new-pro')
  await createUser(email, password)

  await page.goto('/pro/join')
  await page.getByRole('link', { name: 'Já tenho conta' }).click()
  await expect(page).toHaveURL('/sign-in')
  await signIn(page, email)

  await expect(page).toHaveURL('/pro/join')
  await page.getByText('Psicologia', { exact: true }).click()
  await page.getByLabel('Nome completo').fill(uniqueName('Marta Ribeiro'))
  await page.getByRole('button', { name: 'Enviar para verificação' }).click()
  await expect(page.getByText('Informe seu registro no conselho.')).toBeVisible()

  await page.getByLabel('Registro no conselho').fill('CRP 06/654321')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Enviar para verificação' }).click()

  await expect(page).toHaveURL('/pro')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Seu cadastro está em verificação.' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Convites' })).toHaveCount(0)

  await page.goto('/pro/invites')
  await expect(page).toHaveURL('/pro')
})

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

function isCompact(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1440) < 1024
}

test('a verified professional lands on the overview, invites by link and cancels it', async ({
  page,
}) => {
  const email = uniqueEmail('pro')
  await verifiedProfessional(email, password, uniqueName('Helena Prado'))

  await page.goto('/sign-in')
  await signIn(page, email)

  await expect(page).toHaveURL('/pro')
  await expect(page.getByRole('heading', { level: 1, name: 'Visão geral' })).toBeVisible()
  await expect(page.getByText('Nenhum paciente por aqui ainda.')).toBeVisible()

  await page.getByRole('link', { name: 'Convidar paciente' }).click()
  await expect(page).toHaveURL('/pro/invites?new=1')
  const drawer = page.getByRole('dialog', { name: 'Novo convite' })
  await expect(drawer).toBeVisible()
  await drawer.getByText('Por link', { exact: true }).click()
  await drawer.getByRole('button', { name: 'Criar link' }).click()

  await expect(
    drawer.getByText('Link criado. Copie e envie para a pessoa por onde preferir.'),
  ).toBeVisible()
  await expect(drawer.getByLabel('Link do convite')).toHaveValue(/\/invite\/[23456789A-Z]{8}$/)
  await drawer.getByRole('button', { name: 'Fechar' }).click()
  await expect(drawer).toBeHidden()

  const sent = page.getByRole('row').filter({ hasText: 'Convite por link' })
  await expect(sent).toContainText('Pendente')
  await sent.getByRole('button', { name: /^Cancelar convite/ }).click()

  await expect(page.getByText('Convite cancelado.')).toBeVisible()
  await expect(sent).toContainText('Cancelado')
  await expect(sent.getByRole('button')).toHaveCount(0)
})

test('a verified professional finds a linked patient in the table and opens the file', async ({
  page,
}) => {
  const email = uniqueEmail('pro')
  const patient = uniqueName('Marina Costa')
  await verifiedProfessional(email, password, uniqueName('Rafael Costa'))
  await linkedPatient(email, patient)

  await page.goto('/sign-in')
  await signIn(page, email)
  await expect(page).toHaveURL('/pro')
  await expect(page.getByRole('region', { name: 'Registros recentes' })).toContainText(patient)

  await page.getByRole('link', { name: 'Pacientes', exact: true }).click()
  await expect(page).toHaveURL('/pro/patients')
  await page.getByRole('searchbox', { name: 'Buscar paciente' }).fill(patient.slice(0, 6))
  const row = page.getByRole('row').filter({ hasText: patient })
  await expect(row).toContainText('Bem')
  await expect(row.getByRole('cell').nth(2)).toHaveText('1')
  await row.getByRole('cell').nth(2).click()

  await expect(page).toHaveURL(/\/pro\/patients\/[0-9a-f-]{36}$/)
  await expect(page.getByRole('heading', { level: 1, name: patient })).toBeVisible()
  await expect(page.getByText('Registros a partir do vínculo')).toBeVisible()
  await expect(page.getByText('Consegui caminhar antes do trabalho.')).toBeVisible()

  await page.goto(`/pro/patients/${randomUUID()}`)
  await expect(page.getByRole('heading', { name: 'Esta página não existe.' })).toBeVisible()
})

test('a verified professional renames the profile from the account menu and signs out', async ({
  page,
}) => {
  const email = uniqueEmail('pro')
  const name = uniqueName('Helena Prado')
  const renamed = uniqueName('Dra. Helena Prado')
  await verifiedProfessional(email, password, name)

  await page.goto('/sign-in')
  await signIn(page, email)
  await expect(page).toHaveURL('/pro')

  if (isCompact(page)) {
    const bottom = page.getByRole('navigation', { name: 'Navegação da área profissional' })
    await expect(bottom.getByRole('link')).toHaveText(['Visão geral', 'Pacientes', 'Convites'])
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    const menu = page.getByRole('dialog', { name: 'Área profissional' })
    await expect(menu).toBeVisible()
    await expect(menu).toContainText(name)
    await menu.getByRole('link', { name: 'Configurações' }).click()
  } else {
    await page.getByRole('button', { name }).click()
    await expect(page.getByRole('menu', { name: 'Conta' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)
    await page.getByRole('button', { name }).click()
    await page.getByRole('menuitem', { name: 'Configurações' }).click()
  }

  await expect(page).toHaveURL('/pro/settings')
  await expect(page.getByRole('heading', { level: 1, name: 'Configurações' })).toBeVisible()
  const settings = page.getByRole('main')
  await expect(settings.getByText('Psicologia')).toBeVisible()
  await expect(settings.getByText('CRP 06/123456')).toBeVisible()

  await page.getByRole('button', { name: 'Alterar nome exibido aos pacientes' }).click()
  await page.getByLabel('Nome exibido aos pacientes').fill(renamed)
  await page.getByRole('button', { name: 'Salvar nome' }).click()
  await expect(page.getByLabel('Nome exibido aos pacientes')).toHaveCount(0)
  await expect(settings.getByText(renamed)).toBeVisible()

  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await expect(page).toHaveURL('/')
})

test('a professional discovers the area on the public page and goes to sign in', async ({
  page,
}) => {
  await page.goto('/pro/join')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Acompanhe seus pacientes entre as sessões.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Criar conta profissional' }).first(),
  ).toHaveAttribute('href', '/continue?to=/pro/join&via=sign-up')
  await expect(page.getByRole('region', { name: 'Dúvidas de quem atende.' })).toBeVisible()

  await page.getByRole('link', { name: 'Já tenho conta' }).first().click()
  await expect(page).toHaveURL('/sign-in')
})

test('a new professional signs in from the professional page and waits for verification', async ({
  page,
}) => {
  const email = uniqueEmail('new-pro')
  await createUser(email, password)

  await page.goto('/pro/join')
  await page.getByRole('link', { name: 'Já tenho conta' }).first().click()
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

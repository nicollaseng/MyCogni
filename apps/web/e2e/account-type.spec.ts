import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import { councilNumber, finishOnboarding, registeredProfessional } from './support/api'
import { latestCode } from './support/mailpit'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'tipo-de-conta-2026'

async function signIn(page: Page, email: string) {
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

async function onboardedPatient(): Promise<string> {
  const email = uniqueEmail('patient-type')
  await createUser(email, password)
  await finishOnboarding(email, password)
  return email
}

test('a patient who looked at the professional page signs in and lands on today', async ({
  page,
}) => {
  const email = await onboardedPatient()

  await page.goto('/pro/join')
  await page.getByRole('link', { name: 'Já tenho conta' }).first().click()
  await expect(page).toHaveURL('/sign-in')
  await signIn(page, email)

  await expect(page).toHaveURL('/today')
  await page.goto('/sign-in')
  await expect(page).toHaveURL('/today')
})

test('a signed-in patient opening the professional page reads why there is no form', async ({
  page,
}) => {
  const email = await onboardedPatient()
  await page.goto('/sign-in')
  await signIn(page, email)
  await expect(page).toHaveURL('/today')

  await page.goto('/pro/join')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Esta conta é de paciente.' }),
  ).toBeVisible()
  await expect(
    page.getByText('Para atender como profissional, crie uma conta profissional com outro email.'),
  ).toBeVisible()
  await expect(page.getByLabel('Nome completo')).toHaveCount(0)

  await page.goto('/pro')
  await expect(page).toHaveURL('/pro/join')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Esta conta é de paciente.')

  await page.getByRole('button', { name: 'Sair e criar conta profissional' }).click()
  await expect(page).toHaveURL('/sign-up?account=professional')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Criar conta profissional' }),
  ).toBeVisible()
})

test('a professional signs up from the professional page and starts the verification steps', async ({
  page,
}) => {
  const email = uniqueEmail('pro-signup')

  await page.goto('/pro/join')
  await page.getByRole('link', { name: 'Criar conta profissional' }).first().click()
  await expect(page).toHaveURL('/sign-up?account=professional')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Criar conta profissional' }),
  ).toBeVisible()
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Criar conta' }).click()

  await expect(page).toHaveURL('/verify')
  await page.getByLabel('Código').fill(await latestCode(email, /confirmação/))
  await page.getByRole('button', { name: 'Confirmar email' }).click()

  await expect(page).toHaveURL('/pro/join')
  await page.getByLabel('Profissão').selectOption({ label: 'Psicologia' })
  await page.getByLabel('Nome completo').fill(`Clara Nunes ${randomUUID().slice(0, 6)}`)
  await page.getByLabel('Estado (UF)').selectOption('SP')
  await page.getByLabel('Número').fill(councilNumber())
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Enviar para verificação' }).click()

  await expect(page).toHaveURL('/pro')
  await expect(page.getByText('Passo 1 de 3')).toBeVisible()
  await page.goto('/today')
  await expect(page).toHaveURL('/pro')
})

test('a professional who has not sent the registration yet can sign out', async ({ page }) => {
  const email = uniqueEmail('pro-leaves')
  await createUser(email, password, { accountType: 'professional' })

  await page.goto('/sign-in')
  await signIn(page, email)
  await expect(page).toHaveURL('/pro/join')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Seu cadastro profissional' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Sair', exact: true }).click()

  await expect(page).toHaveURL('/')
  await page.goto('/pro/join')
  await expect(page.getByRole('link', { name: 'Criar conta profissional' }).first()).toBeVisible()
})

test('a professional never reaches the patient pages', async ({ page }) => {
  const email = uniqueEmail('pro-type')
  await registeredProfessional(email, password, `Rui Andrade ${randomUUID().slice(0, 6)}`)

  await page.goto('/sign-in')
  await signIn(page, email)
  await expect(page).toHaveURL('/pro')

  for (const path of ['/today', '/onboarding', '/check-in', '/me']) {
    await page.goto(path)
    await expect(page).toHaveURL('/pro')
  }
})

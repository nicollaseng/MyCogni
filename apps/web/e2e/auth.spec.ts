import { expect, test, type Page } from '@playwright/test'
import { finishOnboarding } from './support/api'
import { latestCode } from './support/mailpit'
import { signedOut } from './support/session'
import { createUser, deleteUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'senha-forte-2026'

async function signIn(page: Page, email: string, secret: string) {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(secret)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

test('creates an account with the code sent by email', async ({ page }) => {
  const email = uniqueEmail('signup')
  await page.goto('/sign-up')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Criar conta' }).click()

  await expect(page).toHaveURL('/verify')
  await expect(page.getByText(email)).toBeVisible()

  await page.getByLabel('Código').fill(await latestCode(email, /confirmação/))
  await page.getByRole('button', { name: 'Confirmar email' }).click()

  await expect(page).toHaveURL('/onboarding')
})

test('says when the email already has an account instead of waiting for a code', async ({
  page,
}) => {
  const email = uniqueEmail('signup-existing')
  await createUser(email, password)
  await page.goto('/sign-up')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill('outra-senha-2026')
  await page.getByRole('button', { name: 'Criar conta' }).click()

  await expect(
    page.getByText('Já existe uma conta com este email. Entre ou recupere a senha.'),
  ).toBeVisible()
  await expect(page).toHaveURL('/sign-up')
})

test('asks for a stronger password before creating the account', async ({ page }) => {
  await page.goto('/sign-up')
  await page.getByLabel('Email').fill(uniqueEmail('weak'))
  await page.getByLabel('Senha').fill('curta')
  await page.getByRole('button', { name: 'Criar conta' }).click()

  await expect(page.getByText('A senha precisa ter pelo menos 8 caracteres.')).toBeVisible()
  await expect(page).toHaveURL('/sign-up')
})

test('refuses a wrong confirmation code', async ({ page }) => {
  await page.goto('/sign-up')
  await page.getByLabel('Email').fill(uniqueEmail('wrong-code'))
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page).toHaveURL('/verify')

  await page.getByLabel('Código').fill('000000')
  await page.getByRole('button', { name: 'Confirmar email' }).click()

  await expect(page.getByRole('main').getByRole('alert')).toHaveText(
    'O código expirou ou não confere. Peça um novo.',
  )
})

test('signs in and out', async ({ page }) => {
  const email = uniqueEmail('signin')
  await createUser(email, password)
  await finishOnboarding(email, password)

  await signIn(page, email, password)
  await expect(page).toHaveURL('/today')

  await page.goto('/me/profile')
  await expect(page.getByRole('main').getByText(email).first()).toBeVisible()
  await page.goto('/me/account')
  await page.getByRole('button', { name: 'Sair' }).click()

  await expect(page).toHaveURL('/')
  await page.goto('/today')
  await expect(page).toHaveURL('/sign-in')
})

test('says when the email or the password is wrong', async ({ page }) => {
  const email = uniqueEmail('wrong-password')
  await createUser(email, password)

  await signIn(page, email, 'outra-senha-123')

  await expect(page.getByRole('main').getByRole('alert')).toHaveText('Email ou senha incorretos.')
})

test('sends an unconfirmed account to the code screen', async ({ page }) => {
  const email = uniqueEmail('unconfirmed')
  await createUser(email, password, { confirmed: false })

  await signIn(page, email, password)

  await expect(page).toHaveURL('/verify')
  await page.getByLabel('Código').fill(await latestCode(email, /confirmação/))
  await page.getByRole('button', { name: 'Confirmar email' }).click()
  await expect(page).toHaveURL('/onboarding')
})

test('creates a new password with the code sent by email', async ({ page }) => {
  const email = uniqueEmail('reset')
  await createUser(email, password)
  await finishOnboarding(email, password)

  await page.goto('/forgot-password')
  await page.getByLabel('Email').fill(email)
  await page.getByRole('button', { name: 'Enviar código' }).click()
  await expect(page).toHaveURL('/reset-password')

  await expect(page.getByLabel('Nova senha')).toHaveCount(0)
  await page.getByLabel('Código').fill(await latestCode(email, /nova senha/))
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page).toHaveURL('/new-password')

  await page.getByLabel('Nova senha').fill('nova-senha-2026')
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()
  await expect(page).toHaveURL('/today')

  await page.goto('/me/account')
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL('/')
  await signIn(page, email, 'nova-senha-2026')
  await expect(page).toHaveURL('/today')
})

test('offers another code only a minute after the first one', async ({ page }) => {
  await page.clock.install()
  const email = uniqueEmail('resend')
  await page.goto('/sign-up')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page).toHaveURL('/verify')

  await expect(page.getByText(/Você pode pedir outro código em 0:[5-6]\d|1:00/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Enviar outro código' })).toHaveCount(0)

  await page.clock.fastForward(61_000)
  await expect(page.getByText('Não recebeu?')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Enviar outro código' })).toBeVisible()
})

test('keeps the app behind the sign in', async ({ page }) => {
  for (const path of ['/today', '/check-in', '/me', '/onboarding']) {
    await page.goto(path)
    await expect(page).toHaveURL('/sign-in')
  }
})

test('ends the session when the account no longer exists', async ({ page }) => {
  const email = uniqueEmail('deleted')
  const id = await createUser(email, password)
  await finishOnboarding(email, password)
  await signIn(page, email, password)
  await expect(page).toHaveURL('/today')

  await deleteUser(id)
  await page.goto('/today')

  await expect(page).toHaveURL('/sign-in?error=session')
  await expect(page.getByRole('main').getByRole('alert')).toHaveText(
    'Sua sessão terminou. Entre de novo para continuar.',
  )
  await page.goto('/today')
  await expect(page).toHaveURL('/sign-in')
})

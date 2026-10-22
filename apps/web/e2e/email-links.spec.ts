import { expect, test, type Page } from '@playwright/test'
import { finishOnboarding } from './support/api'
import { emailedTokenHash } from './support/database'
import { signedOut } from './support/session'
import { createUser, emailLinkTokenHash, supabaseUrl, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'senha-forte-2026'
const linkFailed =
  'O link expirou ou foi aberto em outro navegador. Use o código do email ou peça um novo.'

function confirmPath(tokenHash: string, type: 'email' | 'recovery'): string {
  return `/auth/confirm?${new URLSearchParams({ token_hash: tokenHash, type }).toString()}`
}

function defaultSupabaseLink(
  tokenHash: string,
  type: 'signup' | 'recovery',
  redirectTo: string,
): string {
  const query = new URLSearchParams({ token: tokenHash, type, redirect_to: redirectTo })
  return `${supabaseUrl}/auth/v1/verify?${query.toString()}`
}

async function signUp(page: Page, email: string) {
  await page.goto('/sign-up')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page).toHaveURL('/verify')
}

async function requestRecovery(page: Page, email: string) {
  await page.goto('/forgot-password')
  await page.getByLabel('Email').fill(email)
  await page.getByRole('button', { name: 'Enviar código' }).click()
  await expect(page).toHaveURL('/reset-password')
}

async function signIn(page: Page, email: string, secret: string) {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(secret)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

test('creates an account with the link sent by email', async ({ page }) => {
  const email = uniqueEmail('signup-link')
  await signUp(page, email)
  await expect(page.getByText('ou toque no link do email', { exact: false })).toBeVisible()

  await page.goto(confirmPath(await emailLinkTokenHash('signup', email, password), 'email'))

  await expect(page).toHaveURL('/onboarding')
  await page.goto('/sign-in')
  await expect(page).not.toHaveURL('/sign-in')
})

test('creates a new password with the link sent by email', async ({ page }) => {
  const email = uniqueEmail('reset-link')
  await createUser(email, password)
  await finishOnboarding(email, password)

  await page.goto('/forgot-password')
  await expect(page.getByText('enviamos um código e um link', { exact: false })).toBeVisible()
  await requestRecovery(page, email)
  await expect(page.getByText('toque no link do email', { exact: false })).toBeVisible()

  await page.goto(confirmPath(await emailLinkTokenHash('recovery', email), 'recovery'))

  await expect(page).toHaveURL('/new-password')
  await expect(page.getByRole('heading', { level: 1, name: 'Crie uma nova senha' })).toBeVisible()
  await page.getByLabel('Nova senha').fill('nova-senha-link-2026')
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()
  await expect(page).toHaveURL('/today')

  await page.goto('/me/account')
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL('/')
  await signIn(page, email, password)
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('Email ou senha incorretos.')
  await signIn(page, email, 'nova-senha-link-2026')
  await expect(page).toHaveURL('/today')
})

test('confirms the account with the default Supabase link in the same browser', async ({
  page,
  baseURL,
}) => {
  const email = uniqueEmail('signup-default-link')
  await signUp(page, email)

  await page.goto(
    defaultSupabaseLink(
      await emailedTokenHash(email, 'signup'),
      'signup',
      `${String(baseURL)}/auth/callback?flow=email`,
    ),
  )

  await expect(page).toHaveURL('/onboarding')
})

test('opens the new password screen with the default Supabase recovery link', async ({
  page,
  baseURL,
}) => {
  const email = uniqueEmail('reset-default-link')
  await createUser(email, password)
  await requestRecovery(page, email)

  await page.goto(
    defaultSupabaseLink(
      await emailedTokenHash(email, 'recovery'),
      'recovery',
      `${String(baseURL)}/auth/callback?flow=recovery`,
    ),
  )

  await expect(page).toHaveURL('/new-password')
})

test('explains a default Supabase recovery link opened in another browser', async ({
  page,
  browser,
  baseURL,
}) => {
  const email = uniqueEmail('reset-default-elsewhere')
  await createUser(email, password)
  await requestRecovery(page, email)
  const elsewhere = await browser.newPage({ baseURL, locale: 'pt-BR' })

  await elsewhere.goto(
    defaultSupabaseLink(
      await emailedTokenHash(email, 'recovery'),
      'recovery',
      `${String(baseURL)}/auth/callback?flow=recovery`,
    ),
  )

  await expect(elsewhere).toHaveURL('/sign-in?error=link')
  await expect(elsewhere.getByRole('main').getByRole('alert')).toHaveText(linkFailed)
  await elsewhere.close()
})

test('asks for a stronger password after the recovery link', async ({ page }) => {
  const email = uniqueEmail('reset-link-weak')
  await createUser(email, password)

  await page.goto(confirmPath(await emailLinkTokenHash('recovery', email), 'recovery'))
  await expect(page).toHaveURL('/new-password')
  await page.getByLabel('Nova senha').fill('somenteletras')
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()

  await expect(page.getByText('Use letras e números na senha.')).toBeVisible()
  await expect(page).toHaveURL('/new-password')
})

test('sends a signed out visitor from the new password screen to the recovery', async ({
  page,
}) => {
  await page.goto('/new-password')

  await expect(page).toHaveURL('/forgot-password')
})

for (const path of [
  confirmPath('not-a-real-token', 'email'),
  confirmPath('not-a-real-token', 'recovery'),
  '/auth/confirm?token_hash=not-a-real-token&type=https://evil.example',
  '/auth/confirm?type=email',
  '/auth/callback?flow=recovery&code=not-a-real-code',
  '/auth/callback?flow=email&code=not-a-real-code',
  '/auth/callback?flow=recovery&error=access_denied&error_code=otp_expired',
]) {
  test(`explains a broken email link at ${path}`, async ({ page }) => {
    await page.goto(path)

    await expect(page).toHaveURL('/sign-in?error=link')
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(linkFailed)
  })
}

test('keeps a recovery link that was already used from opening the app again', async ({ page }) => {
  const email = uniqueEmail('reset-link-reused')
  await createUser(email, password)
  const path = confirmPath(await emailLinkTokenHash('recovery', email), 'recovery')

  await page.goto(path)
  await expect(page).toHaveURL('/new-password')
  await page.context().clearCookies()
  await page.goto(path)

  await expect(page).toHaveURL('/sign-in?error=link')
})

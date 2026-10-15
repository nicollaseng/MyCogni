import { expect, test, type Locator, type Page } from '@playwright/test'
import { finishOnboarding } from './support/api'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

const password = 'abas-e2e-2026'

function mainNavigation(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Navegação principal' })
}

function navigationRequests(page: Page): string[] {
  const paths: string[] = []
  page.on('request', (request) => {
    const prefetch = request.headers()['next-router-prefetch']
    if (request.url().includes('_rsc=') && prefetch === undefined) {
      paths.push(new URL(request.url()).pathname)
    }
  })
  return paths
}

async function signInAsNewPerson(page: Page): Promise<void> {
  const email = uniqueEmail('abas')
  await createUser(email, password)
  await finishOnboarding(email, password)
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/today')
  await page.waitForLoadState('networkidle')
}

test.describe('switching tabs', () => {
  test.skip(
    process.env.E2E_PRODUCTION !== '1',
    'prefetching and the client cache only run in a production build',
  )
  test.use({ storageState: signedOut })

  test('opens prefetched tabs without asking the server again', async ({ page }) => {
    await signInAsNewPerson(page)
    const requested = navigationRequests(page)

    async function openTab(name: string, path: string, ready: Locator): Promise<void> {
      const before = requested.length
      await mainNavigation(page).getByRole('link', { name }).click()
      await expect(ready).toBeVisible()
      expect(requested.slice(before)).not.toContain(path)
      await page.waitForLoadState('networkidle')
    }

    await openTab('Registros', '/entries', page.getByText('Seu primeiro registro aparece aqui.'))
    await openTab(
      'Padrões',
      '/patterns',
      page.getByText('Seus padrões aparecem aqui conforme você registra.'),
    )
    await openTab(
      'Zen',
      '/zen',
      page.getByText('Conteúdo educativo. Não substitui acompanhamento profissional.'),
    )
    await openTab(
      'Hoje',
      '/today',
      page.getByText('Seus dias aparecem aqui conforme você registra.'),
    )
  })

  test('shows a new check-in on Hoje and Registros right after saving it', async ({ page }) => {
    await signInAsNewPerson(page)
    await mainNavigation(page).getByRole('link', { name: 'Registros' }).click()
    await expect(page.getByText('Seu primeiro registro aparece aqui.')).toBeVisible()
    await mainNavigation(page).getByRole('link', { name: 'Hoje' }).click()
    await expect(page.getByText('Seus dias aparecem aqui conforme você registra.')).toBeVisible()

    await page.getByRole('link', { name: 'Registrar como estou' }).click()
    await page.getByRole('slider', { name: 'Como você está agora?' }).fill('5')
    await page.getByRole('button', { name: 'Registrar só o humor' }).click()
    await expect(page.getByRole('heading', { name: /^Registrado às \d{2}:\d{2}\.$/ })).toBeVisible()

    await page.getByRole('link', { name: 'Ver registros' }).click()
    await expect(page.getByRole('status')).toHaveText('1 registro')
    await mainNavigation(page).getByRole('link', { name: 'Hoje' }).click()
    await expect(page.getByText('1 de 14 dias com registro.')).toBeVisible()
  })

  test('lists a page written in MyBook and opens it again with the latest text', async ({
    page,
  }) => {
    const title = `Caderno ${String(Date.now())}`
    const body = page.getByRole('textbox', { name: 'Texto da página' })
    const saved = page.getByRole('main').getByRole('status')
    await signInAsNewPerson(page)

    await mainNavigation(page).getByRole('link', { name: 'MyBook' }).click()
    await page.getByRole('button', { name: 'Nova página' }).first().click()
    await expect(page).toHaveURL(/\/mybook\/[0-9a-f-]{36}$/)
    await page.getByLabel('Título da página').fill(title)
    await body.click()
    await page.keyboard.type('Primeira linha.')
    await expect(saved).toHaveText('Salvo')

    await mainNavigation(page).getByRole('link', { name: 'MyBook' }).click()
    await page.getByRole('link', { name: new RegExp(title) }).click()
    await expect(body).toContainText('Primeira linha.')
    await body.click()
    await page.keyboard.press('End')
    await page.keyboard.type(' Segunda frase.')
    await expect(saved).toHaveText('Salvo')

    await mainNavigation(page).getByRole('link', { name: 'MyBook' }).click()
    await page.getByRole('link', { name: new RegExp(title) }).click()
    await expect(body).toContainText('Primeira linha. Segunda frase.')
  })
})

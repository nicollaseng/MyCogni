import { expect, test, type Page } from '@playwright/test'
import { finishOnboarding, recordPractice } from './support/api'
import { signedOut } from './support/session'
import { createUser, makeAdmin, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'zen-pratica-2026'

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/sign-in/)
}

async function readyPerson(page: Page, prefix: string): Promise<string> {
  const email = uniqueEmail(prefix)
  await createUser(email, password)
  await finishOnboarding(email, password)
  await signIn(page, email)
  return email
}

function practice(page: Page) {
  return page.getByRole('region', { name: 'Sua prática' })
}

test('meditates with the voice, says how it feels and sees it on the practice map', async ({
  page,
}) => {
  test.setTimeout(240_000)
  await readyPerson(page, 'meditar')
  await page.goto('/zen')
  await expect(practice(page)).toContainText('Quando você praticar, os dias aparecem aqui.')

  const card = page
    .getByRole('region', { name: 'Meditações' })
    .getByRole('button', { name: /Quando a ansiedade aperta/ })
  await expect(async () => {
    await page.reload()
    await expect(card).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 90_000 })
  await card.click()
  const mode = page.getByRole('dialog', { name: 'Quando a ansiedade aperta' })
  await expect(
    mode.getByRole('group', { name: 'Duração' }).getByRole('button').first(),
  ).toHaveAttribute('aria-pressed', 'true')
  await mode.getByRole('button', { name: 'Começar' }).click()
  await expect(mode.getByRole('status')).toHaveText('Tocando')
  await mode.getByRole('button', { name: 'Pausar' }).click()
  await expect(mode.getByRole('button', { name: 'Continuar' })).toBeVisible()
  await mode.getByRole('button', { name: 'Continuar' }).click()
  const forward = mode.getByRole('button', { name: 'Avançar 15 segundos' })
  await expect(async () => {
    await forward.click({ timeout: 1000 })
    await expect(mode.getByRole('status')).toHaveText('Pronto.', { timeout: 300 })
  }).toPass({ timeout: 60_000 })

  await mode.getByRole('button', { name: 'Bem', exact: true }).click()
  await expect(mode.getByText('Anotado: Bem.')).toBeVisible()
  await expect(mode.getByRole('link', { name: 'Escrever no MyBook' })).toHaveAttribute(
    'href',
    '/mybook',
  )
  await mode.getByRole('button', { name: 'Fechar' }).last().click()
  await expect(mode).toHaveCount(0)

  await page.reload()
  await expect(practice(page)).toContainText('Sessões nesta semana1')
  await expect(
    practice(page).getByRole('img', { name: '1 dia com prática nas últimas 8 semanas' }),
  ).toBeVisible()
  await practice(page).getByRole('link', { name: 'Ver tudo' }).click()
  await expect(page).toHaveURL('/zen/practice')
  const recent = page.getByRole('region', { name: 'Sessões recentes' })
  await expect(recent).toContainText('Quando a ansiedade aperta')
  await expect(recent.getByRole('img', { name: 'Depois: Bem' })).toBeVisible()
  await expect(
    page.getByRole('img', { name: /1 dia com prática nas últimas 12 semanas/ }),
  ).toBeVisible()
})

test('plays the Acalmar sound programme and stops it gently', async ({ page }) => {
  await readyPerson(page, 'sons')
  await page.goto('/zen')

  await page
    .getByRole('region', { name: 'Sons' })
    .getByRole('button', { name: /Acalmar/ })
    .click()
  const mode = page.getByRole('dialog', { name: 'Acalmar' })
  await expect(
    mode.getByText('Use fones de ouvido para o efeito binaural. Volume baixo.'),
  ).toBeVisible()
  await expect(mode.getByTestId('sound-caution')).toBeVisible()
  await mode.getByRole('button', { name: 'Começar' }).click()
  await expect(mode.getByRole('status')).toHaveText('Tocando')
  await expect(mode.getByTestId('sound-clock')).toHaveText(/19:5\d/)
  await mode.getByRole('button', { name: 'Parar' }).click()
  await expect(mode.getByRole('status')).toHaveText('Pronto.')
  await mode.getByRole('button', { name: 'Fechar' }).last().click()

  await page
    .getByRole('region', { name: 'Sons' })
    .getByRole('button', { name: /Acalmar/ })
    .click()
  await expect(
    page.getByRole('dialog', { name: 'Acalmar' }).getByTestId('sound-caution'),
  ).toHaveCount(0)
})

test('reads an article to the end and finishes a whole track', async ({ page }) => {
  test.setTimeout(120_000)
  await readyPerson(page, 'leitura')
  await page.goto('/zen/articles/screening-not-diagnosis')
  await page.waitForTimeout(11_000)
  const recorded = page.waitForResponse('**/practice/sessions')
  await page.getByTestId('reading-end').scrollIntoViewIfNeeded()
  await expect(page.getByRole('button', { name: 'Lida' })).toBeVisible({ timeout: 10_000 })
  expect((await recorded).status()).toBe(201)

  await page.goto('/zen/practice')
  await expect(page.getByRole('region', { name: 'Sessões recentes' })).toContainText(
    'Triagem não é diagnóstico',
  )

  await page.goto('/zen/tracks/seeking-help')
  for (const name of [
    'Ler: quando buscar ajuda',
    'Saber a quem recorrer',
    'Ler: triagem não é diagnóstico',
    'Escrever no MyBook',
  ]) {
    await page.getByRole('listitem', { name }).getByRole('button', { name }).click()
    await page
      .getByRole('listitem', { name })
      .getByRole('button', { name: 'Marcar como feito' })
      .click()
    await expect(
      page.getByRole('listitem', { name }).getByRole('button', { name: 'Feito' }),
    ).toHaveAttribute('aria-pressed', 'true')
  }
  await expect(page.getByText('Trilha concluída. Volte quando quiser.')).toBeVisible()
})

test('shows the team only aggregated Zen numbers and hides small groups', async ({ page }) => {
  test.setTimeout(150_000)
  for (let index = 0; index < 5; index++) {
    const email = uniqueEmail('agregado')
    await createUser(email, password)
    await finishOnboarding(email, password)
    await recordPractice(email, password, [
      { kind: 'meditation', contentId: 'inner-peace', seconds: 600, completed: true },
    ])
  }
  const adminEmail = uniqueEmail('equipe-zen')
  const adminId = await createUser(adminEmail, password)
  await makeAdmin(adminId)
  await signIn(page, adminEmail)

  await page.goto('/admin/zen')
  await expect(page.getByRole('heading', { name: 'Zen' })).toBeVisible()
  const peace = page.getByRole('row', { name: /Paz interior/ })
  await expect(peace.getByRole('cell').nth(0)).not.toHaveText('—')
  await expect(peace.getByRole('cell').nth(2)).not.toHaveText('—')
  const quiet = page.getByRole('row', { name: /Para quem está de luto/ })
  await expect(quiet.getByRole('cell').first()).toHaveText('—')
})

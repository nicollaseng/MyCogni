import { expect, test, type Page } from '@playwright/test'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'onboarding-2026'

async function signInAsNewPerson(page: Page) {
  const email = uniqueEmail('onboarding')
  await createUser(email, password)
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/onboarding')
}

async function acceptRequiredConsents(page: Page) {
  const accept = page.getByRole('button', { name: 'Concordar e continuar' })
  await page.getByRole('checkbox', { name: 'Tenho 18 anos ou mais.' }).check()
  await page.getByRole('checkbox', { name: /Li e aceito os Termos de uso/ }).check()
  await expect(accept).toBeDisabled()
  await page.getByRole('checkbox', { name: /Autorizo o tratamento/ }).check()
  await accept.click()
}

async function answer(page: Page, form: string, total: number, choices: readonly string[]) {
  for (const [index, choice] of choices.entries()) {
    await expect(page.getByText(`${form} · ${String(index + 1)} de ${String(total)}`)).toBeVisible()
    await page.getByRole('button', { name: choice, exact: true }).click()
  }
}

async function reachQuestions(page: Page) {
  await signInAsNewPerson(page)
  await acceptRequiredConsents(page)
  await page.getByLabel('Nome').fill('Marina')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Continuar sem foto' }).click()
  await page.getByRole('button', { name: 'Começar' }).click()
}

test('takes a new person from consent to results, with support when item 9 is flagged', async ({
  page,
}) => {
  await reachQuestions(page)

  await answer(page, 'PHQ-9', 9, [
    ...Array.from({ length: 8 }, () => 'Mais da metade dos dias'),
    'Vários dias',
  ])

  await expect(page.getByRole('heading', { name: 'Obrigado por contar.' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ligar para o CVV' })).toHaveAttribute(
    'href',
    'tel:188',
  )
  await page.getByRole('button', { name: 'Continuar o questionário' }).click()

  await answer(
    page,
    'GAD-7',
    7,
    Array.from({ length: 7 }, () => 'Vários dias'),
  )

  await expect(page.getByRole('heading', { name: 'Seu ponto de partida.' })).toBeVisible()
  const depression = page.getByRole('region', { name: 'Sinais de depressão' })
  await expect(depression).toContainText('17de 27')
  await expect(depression).toContainText('Moderadamente grave')
  await expect(page.getByRole('region', { name: 'Sinais de ansiedade' })).toContainText('7de 21')
  await expect(page.getByRole('link', { name: '188' })).toBeVisible()

  await page.getByRole('button', { name: 'Começar a usar' }).click()
  await expect(page).toHaveURL('/today')

  await page.goto('/onboarding')
  await expect(page).toHaveURL('/today')
})

test('picks up where the person stopped', async ({ page }) => {
  await reachQuestions(page)
  await answer(
    page,
    'PHQ-9',
    9,
    Array.from({ length: 9 }, () => 'Nenhuma vez'),
  )
  await expect(page.getByText('GAD-7 · 1 de 7')).toBeVisible()

  await page.reload()

  await expect(page.getByText('GAD-7 · 1 de 7')).toBeVisible()
})

test('keeps the app closed until onboarding is done', async ({ page }) => {
  await signInAsNewPerson(page)

  for (const path of ['/today', '/check-in', '/me']) {
    await page.goto(path)
    await expect(page).toHaveURL('/onboarding')
  }
})

test('lets the person leave in the middle', async ({ page }) => {
  await signInAsNewPerson(page)

  await page.getByRole('button', { name: 'Sair' }).click()

  await expect(page).toHaveURL('/')
})

test('fits each question on the screen without scrolling', async ({ page }) => {
  await reachQuestions(page)
  await answer(
    page,
    'PHQ-9',
    9,
    Array.from({ length: 7 }, () => 'Nenhuma vez'),
  )

  await expect(page.getByText('PHQ-9 · 8 de 9')).toBeVisible()
  const fits = await page.evaluate(() => {
    const root = document.scrollingElement
    return root !== null && root.scrollHeight <= window.innerHeight + 1
  })
  expect(fits).toBe(true)
})

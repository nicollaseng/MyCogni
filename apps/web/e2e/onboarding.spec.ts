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

async function answer(page: Page, total: number, choices: readonly string[], from = 1) {
  for (const [offset, choice] of choices.entries()) {
    await expect(
      page.getByText(`Pergunta ${String(from + offset)} de ${String(total)}`),
    ).toBeVisible()
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

test('takes a new person from consent to results in five questions when nothing calls for more', async ({
  page,
}) => {
  await reachQuestions(page)

  await expect(page.getByText('Nas últimas 2 semanas')).toBeVisible()
  await answer(page, 5, ['Nenhuma vez', 'Vários dias', 'Vários dias', 'Nenhuma vez', 'Nenhuma vez'])

  await expect(page.getByRole('heading', { name: 'Seu ponto de partida.' })).toBeVisible()
  const depression = page.getByRole('region', { name: 'Desânimo' })
  await expect(depression).toContainText('DesânimoBaixo')
  await expect(page.getByRole('region', { name: 'Ansiedade' })).toContainText('AnsiedadeBaixo')
  await expect(page.getByRole('main')).not.toContainText(/PHQ|GAD|de 6/)

  await page.getByRole('button', { name: 'Começar a usar' }).click()
  await expect(page).toHaveURL('/today')
})

test('asks more about mood when the mood screen is positive, with support when item 9 is flagged', async ({
  page,
}) => {
  await reachQuestions(page)

  await answer(page, 5, [
    'Mais da metade dos dias',
    'Mais da metade dos dias',
    'Nenhuma vez',
    'Nenhuma vez',
  ])
  await expect(
    page.getByRole('heading', { name: 'Mais algumas perguntas sobre ânimo' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await answer(
    page,
    11,
    [...Array.from({ length: 6 }, () => 'Mais da metade dos dias'), 'Vários dias'],
    5,
  )

  await expect(page.getByRole('heading', { name: 'Obrigado por contar.' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ligar para o CVV' })).toHaveAttribute(
    'href',
    'tel:188',
  )
  await page.getByRole('button', { name: 'Continuar o questionário' }).click()

  await expect(page.getByRole('heading', { name: 'Seu ponto de partida.' })).toBeVisible()
  const depression = page.getByRole('region', { name: 'Desânimo' })
  await expect(depression).toContainText('DesânimoAlto')
  await expect(depression).not.toContainText(/de 27|PHQ/)
  await expect(page.getByRole('link', { name: '188' })).toBeVisible()

  await page.getByRole('button', { name: 'Começar a usar' }).click()
  await expect(page).toHaveURL('/today')
  await page.goto('/onboarding')
  await expect(page).toHaveURL('/today')
})

test('picks up where the person stopped', async ({ page }) => {
  await reachQuestions(page)
  await answer(page, 5, ['Nenhuma vez', 'Nenhuma vez', 'Vários dias'])
  await expect(page.getByText('Pergunta 4 de 5')).toBeVisible()

  await page.reload()

  await expect(page.getByText('Pergunta 4 de 5')).toBeVisible()
  await answer(page, 5, ['Nenhuma vez', 'Nenhuma vez'], 4)
  await expect(page.getByRole('heading', { name: 'Seu ponto de partida.' })).toBeVisible()
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
  await answer(page, 5, ['Nenhuma vez', 'Nenhuma vez', 'Nenhuma vez', 'Nenhuma vez'])

  await expect(page.getByText('Pergunta 5 de 5')).toBeVisible()
  const fits = await page.evaluate(() => {
    const root = document.scrollingElement
    return root !== null && root.scrollHeight <= window.innerHeight + 1
  })
  expect(fits).toBe(true)
})

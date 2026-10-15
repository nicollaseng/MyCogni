import { expect, test, type Page } from '@playwright/test'
import { finishOnboarding, recordCheckIns } from './support/api'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'registros-2026'

async function signInWithEntries(page: Page) {
  const email = uniqueEmail('registros')
  await createUser(email, password)
  await finishOnboarding(email, password)
  await recordCheckIns(email, password, [
    { moodLevel: 1, emotions: ['anxiety'], contexts: ['work'], note: 'Prazo apertado no trabalho' },
    { moodLevel: 5, emotions: ['joy'], contexts: ['friends'], note: 'Almoço com a Bia' },
    { moodLevel: 3, emotions: ['luto'], contexts: [], note: null },
    { moodLevel: 4, emotions: ['calm'], contexts: ['exercise'], note: null },
  ])
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/today')
}

test('searches notes and the names of emotions in the language in use', async ({ page }) => {
  await signInWithEntries(page)
  await page.goto('/entries')
  await expect(page.getByRole('status')).toHaveText('4 registros')

  const search = page.getByRole('searchbox', { name: 'Buscar nos registros' })
  await search.fill('almoço')
  await search.press('Enter')
  await expect(page).toHaveURL('/entries?q=almo%C3%A7o')
  await expect(page.getByRole('status')).toHaveText('1 registro encontrado')
  await expect(page.getByText('Almoço com a Bia')).toBeVisible()

  await search.fill('ansiedade')
  await search.press('Enter')
  await expect(page.getByRole('status')).toHaveText('1 registro encontrado')
  await expect(page.getByText('Prazo apertado no trabalho')).toBeVisible()

  await search.fill('nada parecido')
  await search.press('Enter')
  await expect(page.getByRole('status')).toHaveText('Nenhum registro encontrado')
  await expect(page.getByText(/Nada por aqui com essa busca/)).toBeVisible()
})

test('filters through one panel, sums the filters up and keeps them in the address', async ({
  page,
}) => {
  await signInWithEntries(page)
  await page.goto('/entries')

  const button = page.getByRole('button', { name: /^Filtros/ })
  await expect(button).toHaveAccessibleName('Filtros, nenhum ativo')
  await button.click()
  const panel = page.getByRole('dialog', { name: 'Filtros' })
  const scale = panel.getByRole('group', { name: 'Humor' })
  await scale.getByRole('button', { name: 'Um pouco bem' }).click()
  await expect(page).toHaveURL('/entries?mood=4')
  await scale.getByRole('button', { name: 'Muito bem' }).click()
  await expect(page).toHaveURL('/entries?mood=4-6')
  await expect(page.getByRole('status')).toHaveText('2 registros encontrados')

  await panel.getByRole('checkbox', { name: 'Só com nota' }).check()
  await expect(page).toHaveURL('/entries?mood=4-6&note=1')
  await panel.getByRole('button', { name: 'Ver 1 registro' }).click()
  await expect(panel).toBeHidden()
  await expect(page.getByText('Humor um pouco bem a muito bem · Com nota')).toBeVisible()
  await expect(page.getByText('Almoço com a Bia')).toBeVisible()

  await page.reload()
  await expect(button).toHaveAccessibleName('Filtros, 2 ativos')
  await expect(page.getByText('Humor um pouco bem a muito bem · Com nota')).toBeVisible()

  await page.getByRole('button', { name: 'Limpar', exact: true }).click()
  await expect(page).toHaveURL('/entries')
  await expect(page.getByRole('status')).toHaveText('4 registros')

  await button.click()
  await panel.getByRole('button', { name: /^Emoções/ }).click()
  await panel.getByRole('group', { name: 'Suas' }).getByRole('checkbox', { name: 'luto' }).check()
  await expect(page).toHaveURL('/entries?emotion=luto')
  await expect(page.getByRole('status')).toHaveText('1 registro encontrado')
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  const entries = page.getByRole('main').getByRole('listitem')
  await expect(entries).toHaveCount(1)
  await expect(entries).toContainText('luto')

  await page.goBack()
  await expect(page).toHaveURL('/entries')
  await expect(page.getByRole('status')).toHaveText('4 registros')
})

test('shows records with any chosen emotion and narrows them by context', async ({ page }) => {
  await signInWithEntries(page)

  await page.goto('/entries?emotion=luto,anxiety')
  await expect(page.getByRole('status')).toHaveText('2 registros encontrados')
  await expect(page.getByText('Luto ou ansiedade')).toBeVisible()

  await page.goto('/entries?emotion=luto,anxiety&context=work')
  await expect(page.getByRole('status')).toHaveText('1 registro encontrado')
  await expect(page.getByText('Prazo apertado no trabalho')).toBeVisible()
})

test('opens a record read-only and adds a dated note below it', async ({ page }) => {
  await signInWithEntries(page)
  await page.goto('/entries?note=1')

  await page.getByRole('link', { name: /Almoço com a Bia/ }).click()
  await expect(page).toHaveURL(/\/entries\/[0-9a-f-]{36}\?note=1$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Bem' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Emoções' })).toHaveText('alegria')
  await expect(page.getByRole('list', { name: 'Contextos' })).toHaveText('amizades')
  await expect(page.getByText('Almoço com a Bia')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Precisa de ajuda agora?' })).toBeVisible()

  await page.getByRole('button', { name: 'Escrever mais' }).click()
  await page
    .getByRole('textbox', { name: 'O que você quer acrescentar?' })
    .fill('Combinamos de repetir no mês que vem.')
  await page.getByRole('button', { name: 'Guardar' }).click()
  const later = page.getByRole('region', { name: 'Escrito depois' })
  await expect(later).toContainText('Combinamos de repetir no mês que vem.')
  await expect(page.getByRole('textbox')).toHaveCount(0)

  await page.reload()
  await expect(later).toContainText('Combinamos de repetir no mês que vem.')
  await expect(page.getByText('Almoço com a Bia')).toBeVisible()

  await page.getByRole('main').getByRole('link', { name: 'Registros', exact: true }).click()
  await expect(page).toHaveURL('/entries?note=1')
})

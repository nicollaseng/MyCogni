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

test('filters by mood, emotion and note, and keeps the filters in the address', async ({
  page,
}) => {
  await signInWithEntries(page)
  await page.goto('/entries')

  await page.getByRole('combobox', { name: 'Humor' }).selectOption({ label: 'Humor bom' })
  await expect(page).toHaveURL('/entries?mood=good')
  await expect(page.getByRole('status')).toHaveText('2 registros encontrados')

  await page.getByRole('checkbox', { name: 'Só com nota' }).check()
  await expect(page).toHaveURL('/entries?mood=good&note=1')
  await expect(page.getByRole('status')).toHaveText('1 registro encontrado')

  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Humor' })).toHaveValue('good')
  await expect(page.getByRole('checkbox', { name: 'Só com nota' })).toBeChecked()
  await expect(page.getByText('Almoço com a Bia')).toBeVisible()

  await page.getByRole('button', { name: 'Limpar filtros' }).click()
  await expect(page).toHaveURL('/entries')
  await page.getByRole('combobox', { name: 'Emoção' }).selectOption('luto')
  await expect(page).toHaveURL('/entries?emotion=luto')
  await expect(page.getByRole('status')).toHaveText('1 registro encontrado')
  const entries = page.getByRole('main').getByRole('listitem')
  await expect(entries).toHaveCount(1)
  await expect(entries).toContainText('luto')

  await page.goBack()
  await expect(page).toHaveURL('/entries')
  await expect(page.getByRole('status')).toHaveText('4 registros')
})

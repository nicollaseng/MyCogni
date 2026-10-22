import { expect, test, type Page } from '@playwright/test'
import { addMemories, finishOnboarding } from './support/api'
import { seedLearnedMemories } from './support/memories'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'memorias-2026'

async function signInAsReadyPerson(page: Page): Promise<{ id: string; email: string }> {
  const email = uniqueEmail('memorias')
  const id = await createUser(email, password)
  await finishOnboarding(email, password)
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/today')
  return { id, email }
}

test('adds, edits and deletes a memory the person writes', async ({ page }) => {
  await signInAsReadyPerson(page)
  await page.goto('/me/memories')
  await expect(page.getByRole('heading', { level: 1, name: 'Memórias' })).toBeVisible()
  await expect(page.getByText('Nada guardado ainda.')).toBeVisible()

  await page.getByRole('button', { name: 'Adicionar memória' }).click()
  await page.getByLabel('Nova memória').fill('Gosto de chá de camomila antes de dormir.')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('main').getByRole('status').last()).toHaveText('Memória salva.')
  await page.reload()
  const memory = page.getByRole('listitem').filter({ hasText: 'chá de camomila' })
  await expect(memory).toContainText('Adicionada por você')

  await memory.getByRole('button', { name: /^Editar/ }).click()
  await page.getByLabel('Memória', { exact: true }).fill('Gosto de chá de hortelã à noite.')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('Gosto de chá de hortelã à noite.')).toBeVisible()
  await page.reload()
  const edited = page.getByRole('listitem').filter({ hasText: 'hortelã' })
  await expect(edited).toBeVisible()

  await edited.getByRole('button', { name: /^Apagar/ }).click()
  await expect(page.getByText('Nada guardado ainda.')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Nada guardado ainda.')).toBeVisible()
})

test('shows where each learned memory came from', async ({ page }) => {
  const { id } = await signInAsReadyPerson(page)
  await seedLearnedMemories(id, [
    {
      content: 'Caminhar depois do almoço ajuda a se acalmar.',
      kind: 'coping',
      source: 'check_in',
      daysAgo: 3,
    },
    {
      content: 'A irmã Ana é uma pessoa importante de apoio.',
      kind: 'relationship',
      source: 'conversation',
      daysAgo: 2,
    },
    {
      content: 'Dorme melhor quando desliga o celular cedo.',
      kind: 'routine',
      source: 'journal',
      daysAgo: 1,
    },
  ])

  await page.goto('/me/memories')

  await expect(page.getByRole('listitem').filter({ hasText: 'Caminhar' })).toContainText(
    /De um registro de \d+ de [a-z]{3}\.?/,
  )
  await expect(page.getByRole('listitem').filter({ hasText: 'irmã Ana' })).toContainText(
    'De uma conversa',
  )
  await expect(page.getByRole('listitem').filter({ hasText: 'celular' })).toContainText('Do MyBook')
})

test('turns the memories off and on, here and in privacy', async ({ page }) => {
  await signInAsReadyPerson(page)
  await page.goto('/me/memories')
  const toggle = page.getByRole('switch', { name: 'Lembrar do que eu conto' })

  await expect(toggle).toHaveAttribute('aria-checked', 'true')
  await toggle.click()
  await expect(page.getByText('O Cogni não vai guardar nada novo.')).toBeVisible()
  await page.reload()
  await expect(toggle).toHaveAttribute('aria-checked', 'false')

  await page.goto('/me/privacy')
  const mirrored = page.getByRole('switch', { name: 'Lembrar do que eu conto' })
  await expect(mirrored).toHaveAttribute('aria-checked', 'false')
  await mirrored.click()
  await expect(page.getByText('O Cogni volta a lembrar do que você conta.')).toBeVisible()
  await page.goto('/me/memories')
  await expect(toggle).toHaveAttribute('aria-checked', 'true')
})

test('deletes every memory after confirming', async ({ page }) => {
  const { email } = await signInAsReadyPerson(page)
  await addMemories(email, password, ['Gosto de jazz.', 'Quero correr 5 km até dezembro.'])
  await page.goto('/me/memories')
  const saved = page.getByRole('list', { name: 'Memórias guardadas' }).getByRole('listitem')
  await expect(saved).toHaveCount(2)

  await page.getByRole('button', { name: 'Apagar todas' }).click()
  const confirm = page.getByRole('alertdialog', { name: 'Apagar todas as memórias?' })
  await confirm.getByRole('button', { name: 'Cancelar' }).click()
  await expect(confirm).toHaveCount(0)
  await expect(saved).toHaveCount(2)

  await page.getByRole('button', { name: 'Apagar todas' }).click()
  await confirm.getByRole('button', { name: 'Apagar todas' }).click()
  await expect(page.getByText('Nada guardado ainda.')).toBeVisible()
  await page.reload()
  await expect(saved).toHaveCount(0)
})

test('opens Memórias from the settings sections', async ({ page, isMobile }) => {
  await signInAsReadyPerson(page)
  await page.goto('/me')
  await page
    .getByRole('navigation', { name: 'Seções de perfil e configurações' })
    .getByRole('link', { name: 'Memórias', exact: true })
    .click()

  await expect(page).toHaveURL('/me/memories')
  await expect(page.getByRole('heading', { level: 1, name: 'Memórias' })).toBeVisible()
  if (!isMobile) {
    await expect(page.getByRole('link', { name: 'Memórias', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    )
  }
})

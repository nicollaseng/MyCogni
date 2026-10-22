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

function options(page: Page, content: string) {
  return page.getByRole('button', { name: `Opções: ${content}` })
}

async function expectNoSideScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

async function choose(page: Page, content: string, action: 'Editar' | 'Apagar'): Promise<void> {
  await options(page, content).click()
  await page.getByRole('menuitem', { name: action, exact: true }).click()
}

test('adds a memory with a kind and edits it in place', async ({ page }) => {
  await signInAsReadyPerson(page)
  await page.goto('/me/memories')
  await expect(page.getByRole('heading', { level: 1, name: 'Memórias' })).toBeVisible()
  await expect(page.getByText('Nada guardado ainda.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mais opções' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Adicionar memória' }).click()
  await page.getByLabel('Nova memória').fill('Quero voltar a correr 5 km até dezembro.')
  await expect(page.getByLabel('Tipo')).toHaveValue('fact')
  await page.getByLabel('Tipo').selectOption({ label: 'Objetivos' })
  await expectNoSideScroll(page)
  await page.getByRole('button', { name: 'Salvar' }).click()
  const goals = page.getByRole('list', { name: 'Objetivos' })
  await expect(goals.getByRole('listitem')).toHaveText(
    'Quero voltar a correr 5 km até dezembro.Adicionada por você',
  )
  await expect(page.getByRole('heading', { level: 2, name: 'Objetivos · 1' })).toBeVisible()

  await page.reload()
  await expect(goals.getByRole('listitem')).toContainText('Quero voltar a correr 5 km')
  await choose(page, 'Quero voltar a correr 5 km até dezembro.', 'Editar')
  const field = page.getByLabel('Memória', { exact: true })
  await expect(field).toBeFocused()
  expect(
    await field.evaluate((element: HTMLTextAreaElement) => [
      element.selectionStart,
      element.value.length,
    ]),
  ).toEqual([40, 40])
  await field.fill('Quero correr 10 km até março.')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(options(page, 'Quero correr 10 km até março.')).toBeFocused()

  await page.reload()
  await expect(goals.getByRole('listitem')).toHaveText(
    'Quero correr 10 km até março.Adicionada por você',
  )
})

test('deletes a memory and brings it back with undo', async ({ page }) => {
  const { email } = await signInAsReadyPerson(page)
  await addMemories(email, password, [
    { content: 'Caminhar depois do almoço ajuda.', kind: 'coping' },
    { content: 'Ouvir jazz à noite acalma.', kind: 'coping' },
  ])
  await page.goto('/me/memories')
  const helps = page.getByRole('list', { name: 'O que ajuda' }).getByRole('listitem')
  await expect(helps).toHaveCount(2)

  await choose(page, 'Caminhar depois do almoço ajuda.', 'Apagar')
  await expect(helps).toHaveCount(1)
  await expect(page.getByText('Memória apagada')).toBeVisible()
  await expectNoSideScroll(page)
  await page.getByRole('button', { name: 'Desfazer' }).click()
  await expect(helps).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'Desfazer' })).toHaveCount(0)

  await page.reload()
  await expect(helps).toHaveCount(2)
})

test('deletes a memory for good once the undo is gone or the person leaves', async ({ page }) => {
  const { email } = await signInAsReadyPerson(page)
  await addMemories(email, password, [
    { content: 'Dorme melhor sem celular.', kind: 'routine' },
    { content: 'Faz terapia às quintas.', kind: 'routine' },
    { content: 'Acorda às sete.', kind: 'routine' },
  ])
  await page.goto('/me/memories')
  const routine = page.getByRole('list', { name: 'Rotina' }).getByRole('listitem')
  await expect(routine).toHaveCount(3)

  await choose(page, 'Dorme melhor sem celular.', 'Apagar')
  await expect(page.getByRole('button', { name: 'Desfazer' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Desfazer' })).toHaveCount(0, { timeout: 10_000 })
  await page.reload()
  await expect(routine).toHaveCount(2)
  await expect(routine.filter({ hasText: 'Dorme melhor' })).toHaveCount(0)

  await choose(page, 'Faz terapia às quintas.', 'Apagar')
  await page.getByRole('link', { name: 'Hoje', exact: true }).filter({ visible: true }).click()
  await expect(page).toHaveURL('/today')
  await expect(async () => {
    await page.goto('/me/memories')
    await expect(routine).toHaveCount(1, { timeout: 2_000 })
  }).toPass({ timeout: 15_000 })

  await choose(page, 'Acorda às sete.', 'Apagar')
  await expect(page.getByRole('button', { name: 'Desfazer' })).toBeVisible()
  await expect(async () => {
    await page.reload()
    await expect(page.getByText('Nada guardado ainda.')).toBeVisible({ timeout: 2_000 })
  }).toPass({ timeout: 15_000 })
})

test('shows each learned memory in its group with where it came from', async ({ page }) => {
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

  await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText([
    'O que ajuda · 1',
    'Rotina · 1',
    'Pessoas · 1',
  ])
  await expect(page.getByRole('list', { name: 'O que ajuda' })).toContainText(
    /De um registro de \d+ de [a-z]{3}\.?/,
  )
  await expect(page.getByRole('list', { name: 'Pessoas' })).toContainText('De uma conversa')
  await expect(page.getByRole('list', { name: 'Rotina' })).toContainText('Do MyBook')
})

test('turns the memories off and on, here and in privacy', async ({ page }) => {
  const { email } = await signInAsReadyPerson(page)
  await addMemories(email, password, [{ content: 'Gosto de jazz.', kind: 'preference' }])
  await page.goto('/me/memories')
  const toggle = page.getByRole('switch', { name: 'Lembrar do que eu conto' })

  await expect(toggle).toHaveAttribute('aria-checked', 'true')
  await toggle.click()
  await expect(page.getByText('O Cogni não vai guardar nada novo.')).toBeVisible()
  await expect(toggle).toHaveAccessibleDescription(
    'Desligado, o Cogni não guarda nada novo. O que já está aqui continua.',
  )
  await page.reload()
  await expect(toggle).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByRole('list', { name: 'Do que você gosta' })).toContainText(
    'Gosto de jazz.',
  )

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
  await addMemories(email, password, [
    'Gosto de jazz.',
    { content: 'Quero correr 5 km até dezembro.', kind: 'goal' },
  ])
  await page.goto('/me/memories')
  const saved = page.getByRole('list', { name: /^(Sobre você|Objetivos)$/ }).getByRole('listitem')
  await expect(saved).toHaveCount(2)
  const more = page.getByRole('button', { name: 'Mais opções' })

  await more.click()
  await page.getByRole('menuitem', { name: 'Apagar todas' }).click()
  const confirm = page.getByRole('alertdialog', { name: 'Apagar todas as memórias?' })
  await confirm.getByRole('button', { name: 'Cancelar' }).click()
  await expect(confirm).toHaveCount(0)
  await expect(saved).toHaveCount(2)

  await more.click()
  await page.getByRole('menuitem', { name: 'Apagar todas' }).click()
  await confirm.getByRole('button', { name: 'Apagar todas' }).click()
  await expect(page.getByText('Nada guardado ainda.')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Nada guardado ainda.')).toBeVisible()
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

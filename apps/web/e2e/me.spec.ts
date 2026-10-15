import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { finishOnboarding } from './support/api'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'voce-2026'

const photo = fileURLToPath(new URL('./fixtures/photo.png', import.meta.url))

async function signInAsReadyPerson(page: Page, secret = password): Promise<string> {
  const email = uniqueEmail('voce')
  await createUser(email, secret)
  await finishOnboarding(email, secret)
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(secret)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/today')
  await page.goto('/me')
  return email
}

test('shows the account, the questionnaires and the privacy choices', async ({ page }) => {
  const email = await signInAsReadyPerson(page)

  await expect(page.getByText(email).first()).toBeVisible()
  await expect(page.getByRole('region', { name: 'Seus questionários' })).toContainText('PHQ-9')
  const privacy = page.getByRole('region', { name: 'Privacidade' })
  await expect(privacy).toContainText('Uso dos seus dados de saúde')
  await expect(privacy).toContainText('Resumos escritos por IA')
  await expect(privacy.getByRole('link', { name: 'Política de privacidade' })).toHaveAttribute(
    'href',
    '/privacy',
  )
})

test('renames the person', async ({ page }) => {
  await signInAsReadyPerson(page)

  await page.getByRole('button', { name: 'Alterar nome' }).click()
  await page.getByLabel('Novo nome').fill('Marina Alves')
  await page.getByRole('button', { name: 'Salvar nome' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Marina Alves' })).toBeVisible()
})

test('changes the password after checking the current one', async ({ page }) => {
  const email = await signInAsReadyPerson(page)

  await page.getByRole('button', { name: 'Alterar senha' }).click()
  await page.getByLabel('Senha atual').fill('nao-e-essa-1')
  await page.getByLabel('Nova senha').fill('nova-voce-2026')
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('A senha atual não confere.')

  await page.getByLabel('Senha atual').fill(password)
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()
  await expect(page.getByRole('main').getByRole('status')).toHaveText('Senha alterada.')

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL('/')
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill('nova-voce-2026')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/today')
})

test('adds a photo through the editor, changes it and removes it', async ({ page }) => {
  await signInAsReadyPerson(page)

  await page.getByLabel('Adicionar foto').setInputFiles(photo)
  const editor = page.getByRole('dialog', { name: 'Ajustar foto' })
  await expect(editor).toBeVisible()
  await editor.getByLabel('Tamanho').fill('2')
  await editor.getByRole('button', { name: 'Girar para a direita' }).click()
  await editor.getByRole('button', { name: 'Usar foto' }).click()

  const avatar = page.getByRole('img', { name: 'Sua foto' })
  await expect(avatar).toBeVisible()
  await expect(page.getByRole('main').getByRole('status')).toHaveText('Foto atualizada.')
  const first = await avatar.getAttribute('src')

  await page.getByLabel('Trocar foto').setInputFiles(photo)
  await editor.getByLabel('Ângulo').fill('-10')
  await editor.getByRole('button', { name: 'Usar foto' }).click()
  await expect(avatar).not.toHaveAttribute('src', first ?? '')

  await page.reload()
  await expect(page.getByRole('img', { name: 'Sua foto' })).toBeVisible()
  await page.getByRole('button', { name: 'Remover foto' }).click()
  await expect(page.getByRole('img', { name: 'Sua foto' })).toHaveCount(0)
})

test('downloads everything the person recorded', async ({ page }) => {
  const email = await signInAsReadyPerson(page)

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Baixar meus dados' }).click(),
  ])
  const file = await download.path()
  const data: unknown = JSON.parse(await readFile(file, 'utf8'))

  expect(download.suggestedFilename()).toMatch(/^mycogniai-meus-dados-\d{4}-\d{2}-\d{2}\.json$/)
  expect(data).toEqual(
    expect.objectContaining({
      profile: expect.objectContaining({ email }),
      assessments: expect.arrayContaining([expect.objectContaining({ instrument: 'phq9' })]),
    }),
  )
})

test('deletes the account for good', async ({ page }) => {
  const email = await signInAsReadyPerson(page)

  await page.getByRole('button', { name: 'Excluir minha conta' }).click()
  const forever = page.getByRole('button', { name: 'Excluir para sempre' })
  await expect(forever).toBeDisabled()
  await page.getByLabel('Digite EXCLUIR para confirmar').fill('EXCLUIR')
  await forever.click()

  await expect(page).toHaveURL('/')
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('Email ou senha incorretos.')
})

test('answers the questionnaires again and keeps the history', async ({ page }) => {
  await signInAsReadyPerson(page)

  await page.getByRole('link', { name: 'Refazer os questionários' }).click()
  await expect(page).toHaveURL('/questionnaires')
  await page.getByRole('button', { name: 'Começar' }).click()
  for (const [form, total] of [
    ['PHQ-9', 9],
    ['GAD-7', 7],
  ] as const) {
    for (let index = 1; index <= total; index++) {
      await expect(page.getByText(`${form} · ${String(index)} de ${String(total)}`)).toBeVisible()
      const choice = form === 'PHQ-9' && index === total ? 'Nenhuma vez' : 'Vários dias'
      await page.getByRole('button', { name: choice, exact: true }).click()
    }
  }

  await expect(page.getByRole('heading', { name: 'Seus resultados de hoje.' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Sinais de ansiedade' })).toContainText(
    '7 pontos a mais que em',
  )
  await page.getByRole('link', { name: 'Voltar ao perfil' }).click()
  await expect(page.getByRole('region', { name: 'Seus questionários' })).toContainText('8de 27')
})

test('switches the language from the account page', async ({ page }) => {
  await signInAsReadyPerson(page)

  await page.getByRole('combobox', { name: 'Idioma' }).selectOption('en-US')

  await expect(page.getByRole('region', { name: 'Your questionnaires' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Language' })).toHaveValue('en-US')
  await page.reload()
  await expect(page.getByRole('region', { name: 'Preferences' })).toBeVisible()
})

test('turns the AI summaries on and off', async ({ page }) => {
  await signInAsReadyPerson(page)
  const privacy = page.getByRole('region', { name: 'Privacidade' })
  const toggle = privacy.getByRole('switch', { name: 'Resumos escritos por IA' })

  await expect(toggle).toHaveAttribute('aria-checked', 'false')
  await toggle.click()
  await expect(privacy).toContainText(/Resumos escritos por IAAutorizado em/)
  await page.reload()
  await expect(toggle).toHaveAttribute('aria-checked', 'true')

  await toggle.click()
  await expect(privacy).toContainText('Resumos escritos por IANão autorizado')
})

import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { registeredProfessional, sendRegistrationDocument, tinyPdf } from './support/api'
import { signedOut } from './support/session'
import { uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'cadastro-e2e-2026'

const photo = fileURLToPath(new URL('./fixtures/photo.png', import.meta.url))

function uniqueName(name: string): string {
  return `${name} ${randomUUID().slice(0, 6)}`
}

async function signIn(page: Page, email: string) {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/pro')
}

async function expectStep(page: Page, number: number, title: string) {
  await expect(page.getByText(`Passo ${String(number)} de 3`)).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
}

test('a new professional sends the document, skips the photo and waits for the review', async ({
  page,
}) => {
  const email = uniqueEmail('onboarding-skip')
  const name = uniqueName('Clara Nunes')
  await registeredProfessional(email, password, name)
  await signIn(page, email)

  await expectStep(page, 1, 'Envie o comprovante do seu registro.')
  await expect(
    page.getByRole('navigation', { name: 'Navegação da área profissional' }),
  ).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Abrir menu' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Pacientes' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Enviar comprovante' })).toHaveCount(0)

  await page.getByLabel('Escolher arquivo').setInputFiles({
    name: 'rascunho.pdf',
    mimeType: 'application/pdf',
    buffer: tinyPdf,
  })
  await expect(page.getByText('rascunho.pdf')).toBeVisible()
  await page.getByRole('button', { name: 'Remover' }).click()
  await expect(page.getByText('rascunho.pdf')).toHaveCount(0)
  await page.getByLabel('Escolher arquivo').setInputFiles({
    name: 'Carteira CRP.pdf',
    mimeType: 'application/pdf',
    buffer: tinyPdf,
  })
  await page.getByRole('button', { name: 'Enviar comprovante' }).click()

  await expectStep(page, 2, 'Adicione uma foto ao seu perfil.')
  await page.reload()
  await expectStep(page, 2, 'Adicione uma foto ao seu perfil.')

  await page.getByRole('button', { name: 'Pular por agora' }).click()

  await expectStep(page, 3, 'Seu cadastro está em verificação.')
  await expect(page.getByText('Carteira CRP.pdf')).toBeVisible()
  await page.reload()
  await expectStep(page, 3, 'Seu cadastro está em verificação.')

  await page.getByRole('button', { name }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page).toHaveURL('/')
})

test('a professional who already sent the document resumes at the photo and adds one', async ({
  page,
}) => {
  const email = uniqueEmail('onboarding-photo')
  const name = uniqueName('Davi Rocha')
  await registeredProfessional(email, password, name)
  await sendRegistrationDocument(email, password)
  await signIn(page, email)

  await expectStep(page, 2, 'Adicione uma foto ao seu perfil.')
  await expect(page.getByText('Comprovante recebido. A análise já começou.')).toBeVisible()
  await page.getByLabel('Adicionar foto').setInputFiles(photo)
  const editor = page.getByRole('dialog', { name: 'Ajustar foto' })
  await editor.getByRole('button', { name: 'Usar foto' }).click()
  await expect(editor).toHaveCount(0)
  await expect(page.getByRole('main').getByRole('img', { name: `Foto de ${name}` })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pular por agora' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Continuar' }).click()

  await expectStep(page, 3, 'Seu cadastro está em verificação.')
  await page.reload()
  await expectStep(page, 3, 'Seu cadastro está em verificação.')

  await page.getByRole('button', { name }).click()
  await page.getByRole('menuitem', { name: 'Configurações' }).click()
  await expect(page).toHaveURL('/pro/settings')
  await expect(page.getByRole('main').getByRole('img', { name: `Foto de ${name}` })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao cadastro' }).click()
  await expectStep(page, 3, 'Seu cadastro está em verificação.')
})

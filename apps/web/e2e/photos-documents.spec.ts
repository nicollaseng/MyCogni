import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { acceptInvitation, finishOnboarding, inviteByLink, setPhoto, tinyPdf } from './support/api'
import { signedOut } from './support/session'
import { createUser, makeAdmin, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'fotos-e2e-2026'

const photo = fileURLToPath(new URL('./fixtures/photo.png', import.meta.url))

async function signIn(page: Page, email: string) {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL('/sign-in')
}

async function signedInPage(browser: Browser, email: string): Promise<Page> {
  const context = await browser.newContext({ storageState: signedOut, locale: 'pt-BR' })
  const page = await context.newPage()
  await signIn(page, email)
  return page
}

async function choosePhoto(page: Page, field: string) {
  await page.getByLabel(field).setInputFiles(photo)
  const editor = page.getByRole('dialog', { name: 'Ajustar foto' })
  await editor.getByLabel('Tamanho').fill('1.6')
  await editor.getByRole('button', { name: 'Usar foto' }).click()
  await expect(editor).toHaveCount(0)
}

test('a new person adds a photo while getting started', async ({ page }) => {
  const email = uniqueEmail('photo-onboarding')
  await createUser(email, password)
  await signIn(page, email)
  await expect(page).toHaveURL('/onboarding')
  await page.getByRole('checkbox', { name: 'Tenho 18 anos ou mais.' }).check()
  await page.getByRole('checkbox', { name: /Li e aceito os Termos de uso/ }).check()
  await page.getByRole('checkbox', { name: /Autorizo o tratamento/ }).check()
  await page.getByRole('button', { name: 'Concordar e continuar' }).click()
  await page.getByLabel('Nome').fill('Marina Alves')
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByRole('heading', { name: 'Quer adicionar uma foto?' })).toBeVisible()
  await choosePhoto(page, 'Adicionar foto')
  await expect(page.getByRole('img', { name: 'Sua foto' })).toBeVisible()
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()

  await expect(page.getByRole('button', { name: 'Começar' })).toBeVisible()
})

test('a professional sends the document, the team opens and approves it, and a linked patient sees the photo', async ({
  page,
  browser,
}) => {
  test.slow()
  const name = `Helena Prado ${randomUUID().slice(0, 6)}`
  const email = uniqueEmail('pro-document')
  await createUser(email, password, { accountType: 'professional' })
  await signIn(page, email)

  await page.goto('/pro/join')
  await page.getByText('Psicologia', { exact: true }).click()
  await page.getByLabel('Nome completo').fill(name)
  await page.getByLabel('Registro no conselho').fill('CRP 06/778899')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Enviar para verificação' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Envie o comprovante do seu registro.' }),
  ).toBeVisible()
  await expect(page.getByText(/Apenas a equipe MyCogniAI tem acesso/)).toBeVisible()
  await page.getByLabel('Escolher arquivo').setInputFiles({
    name: 'Carteira CRP.pdf',
    mimeType: 'application/pdf',
    buffer: tinyPdf,
  })
  await page.getByRole('button', { name: 'Enviar comprovante' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Adicione uma foto ao seu perfil.' }),
  ).toBeVisible()
  await choosePhoto(page, 'Adicionar foto')
  await expect(page.getByRole('main').getByRole('img', { name: `Foto de ${name}` })).toBeVisible()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Seu cadastro está em verificação.' }),
  ).toBeVisible()
  await expect(page.getByText('Carteira CRP.pdf')).toBeVisible()
  await expect(page.getByRole('main').getByText('Em análise', { exact: true }).last()).toBeVisible()

  const adminEmail = uniqueEmail('admin')
  await makeAdmin(await createUser(adminEmail, password))
  const team = await signedInPage(browser, adminEmail)
  await team.goto('/admin/professionals')
  const row = team.getByRole('row', { name })
  const open = row.getByRole('link', { name: `Abrir comprovante de ${name} em nova aba` })
  await expect(open).toHaveAttribute('target', '_blank')
  const href = (await open.getAttribute('href')) ?? ''
  const redirect = await team.request.get(href, { maxRedirects: 0 })
  expect(redirect.status()).toBe(303)
  expect(redirect.headers().location).toMatch(
    /\/storage\/v1\/object\/sign\/professional-documents\//,
  )
  const file = await team.request.get(href)
  expect(Buffer.from(await file.body()).equals(tinyPdf)).toBe(true)
  await row.getByRole('button', { name: 'Aprovar' }).click()
  await expect(team.getByRole('status')).toHaveText(`Cadastro de ${name} aprovado.`)
  await team.context().close()

  await page.goto('/pro/settings')
  const settings = page.getByRole('main')
  await expect(settings.getByText('Aprovado')).toBeVisible()
  await expect(settings.getByRole('img', { name: `Foto de ${name}` })).toBeVisible()

  const { code } = await inviteByLink(email, password)
  const visitor = await browser.newContext({ storageState: signedOut, locale: 'pt-BR' })
  const landing = await visitor.newPage()
  await landing.goto(`/invite/${code}`)
  await expect(landing.getByRole('img', { name: `Foto de ${name}` })).toBeVisible()
  await visitor.close()

  const patientEmail = uniqueEmail('patient-photo')
  await createUser(patientEmail, password)
  await finishOnboarding(patientEmail, password)
  await setPhoto(patientEmail, password, await readFile(photo))
  await acceptInvitation(patientEmail, password, code)
  await page.goto('/pro/patients')
  await expect(page.locator('tbody tr').first().locator('img')).toBeVisible()
  const patient = await signedInPage(browser, patientEmail)
  await patient.goto('/me')
  const professionals = patient.getByRole('region', { name: 'Profissionais' })
  await expect(professionals.getByRole('img', { name: `Foto de ${name}` })).toBeVisible()
  await patient.context().close()
})

test('the team rejects with a reason that the professional reads before sending a new document', async ({
  page,
  browser,
}) => {
  const name = `Rafael Lima ${randomUUID().slice(0, 6)}`
  const email = uniqueEmail('pro-rejected')
  await createUser(email, password, { accountType: 'professional' })
  await signIn(page, email)
  await page.goto('/pro/join')
  await page.getByText('Psicanálise', { exact: true }).click()
  await page.getByLabel('Nome completo').fill(name)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Enviar para verificação' }).click()
  await expect(page.getByRole('heading', { name: 'Comprovante de formação' })).toBeVisible()
  await page.getByLabel('Escolher arquivo').setInputFiles({
    name: 'certificado.pdf',
    mimeType: 'application/pdf',
    buffer: tinyPdf,
  })
  await page.getByRole('button', { name: 'Enviar comprovante' }).click()
  await page.getByRole('button', { name: 'Pular por agora' }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Seu cadastro está em verificação.' }),
  ).toBeVisible()

  const adminEmail = uniqueEmail('admin')
  await makeAdmin(await createUser(adminEmail, password))
  const team = await signedInPage(browser, adminEmail)
  await team.goto('/admin/professionals')
  await team.getByRole('row', { name }).getByRole('button', { name: 'Recusar' }).click()
  await team.getByLabel(`Motivo da recusa para ${name}`).fill('O certificado está sem assinatura.')
  await team.getByRole('button', { name: 'Confirmar recusa' }).click()
  await expect(team.getByRole('status')).toHaveText(`Cadastro de ${name} recusado.`)
  await team.context().close()

  await page.reload()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Não conseguimos verificar seu cadastro.' }),
  ).toBeVisible()
  await expect(page.getByText('O certificado está sem assinatura.')).toBeVisible()
  await expect(page.getByText('Passo 1 de 3')).toBeVisible()
  await page.getByLabel('Escolher arquivo').setInputFiles({
    name: 'certificado-assinado.pdf',
    mimeType: 'application/pdf',
    buffer: tinyPdf,
  })
  await page.getByRole('button', { name: 'Enviar comprovante' }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Seu cadastro está em verificação.' }),
  ).toBeVisible()
  await expect(page.getByText('certificado-assinado.pdf')).toBeVisible()
})

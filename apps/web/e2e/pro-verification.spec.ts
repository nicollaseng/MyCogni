import { randomUUID } from 'node:crypto'
import { expect, test, type Browser, type Page } from '@playwright/test'
import {
  acceptInvitation,
  councilNumber,
  finishOnboarding,
  inviteByLink,
  readyForReview,
  registeredProfessional,
  verifiedProfessional,
} from './support/api'
import { latestMail } from './support/mailpit'
import { tickChecklist } from './support/review'
import { signedOut } from './support/session'
import { createUser, makeAdmin, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'verificacao-e2e-2026'

function uniqueName(name: string): string {
  return `${name} ${randomUUID().slice(0, 6)}`
}

async function signIn(page: Page, email: string) {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL('/sign-in')
}

async function teamPage(browser: Browser): Promise<Page> {
  const adminEmail = uniqueEmail('admin')
  await makeAdmin(await createUser(adminEmail, password))
  const context = await browser.newContext({ storageState: signedOut, locale: 'pt-BR' })
  const page = await context.newPage()
  await signIn(page, adminEmail)
  return page
}

async function openReview(team: Page, name: string) {
  await team.goto('/admin/professionals?status=pending')
  await team.getByRole('link', { name: `Revisar cadastro de ${name}` }).click()
  await expect(team.getByRole('heading', { level: 1, name })).toBeVisible()
}

async function join(page: Page, profession: string, name: string) {
  await page.goto('/pro/join')
  await page.getByText(profession, { exact: true }).click()
  await page.getByLabel('Nome completo').fill(name)
}

test('a psychologist joins with a structured CRP and a physician with a CRM', async ({ page }) => {
  const psychologist = uniqueEmail('join-crp')
  const number = councilNumber()
  await createUser(psychologist, password, { accountType: 'professional' })
  await signIn(page, psychologist)

  await join(page, 'Psicologia', uniqueName('Helena Prado'))
  await expect(page.getByRole('group', { name: 'Registro no CRP' })).toBeVisible()
  await page.getByLabel('Estado (UF)').selectOption('PA')
  await page.getByLabel('Número').fill(`${number.slice(0, 2)}.${number.slice(2)}`)
  await expect(page.getByText(`Seu registro: CRP 10/${number}`)).toBeVisible()
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Enviar para verificação' }).click()
  await expect(page.getByText('Passo 1 de 3')).toBeVisible()
  await page.goto('/pro/settings')
  await expect(page.getByRole('main')).toContainText(`CRP 10/${number}`)

  const physician = uniqueEmail('join-crm')
  await createUser(physician, password, { accountType: 'professional' })
  await page.context().clearCookies()
  await signIn(page, physician)
  await join(page, 'Medicina', uniqueName('Rafael Costa'))
  await page.getByLabel('Estado (UF)').selectOption('RJ')
  await page.getByLabel('Número').fill(number)
  await expect(page.getByText(`Seu registro: CRM-RJ ${number}`)).toBeVisible()
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Enviar para verificação' }).click()
  await expect(page.getByText('Passo 1 de 3')).toBeVisible()
})

test('a registration already held by another account is refused', async ({ page }) => {
  const number = councilNumber()
  await registeredProfessional(uniqueEmail('holder'), password, uniqueName('Helena Prado'), number)
  const email = uniqueEmail('duplicate')
  await createUser(email, password, { accountType: 'professional' })
  await signIn(page, email)

  await join(page, 'Psicologia', uniqueName('Outra Pessoa'))
  await page.getByLabel('Estado (UF)').selectOption('SP')
  await page.getByLabel('Número').fill(number)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Enviar para verificação' }).click()

  await expect(
    page.getByText('Este registro já está em outra conta. Se ele é seu, fale com o suporte.'),
  ).toBeVisible()
  await expect(page).toHaveURL('/pro/join')
})

test('the team compares photo and document, approves, and the professional gets the email', async ({
  page,
  browser,
}) => {
  test.slow()
  const name = uniqueName('Helena Prado')
  const email = uniqueEmail('approved')
  await registeredProfessional(email, password, name)
  await readyForReview(email, password)

  const team = await teamPage(browser)
  await openReview(team, name)
  const comparison = team.getByRole('region', { name: 'Comparar com o documento' })
  await expect(comparison.getByRole('img', { name: `Foto de ${name}` })).toBeVisible()
  await expect(comparison.getByText('Abrir documento')).toBeVisible()
  await expect(comparison.getByRole('link', { name: 'Consultar no CFP' })).toHaveAttribute(
    'href',
    'https://cadastro.cfp.org.br/',
  )
  const approve = team.getByRole('button', { name: 'Aprovar' })
  await expect(approve).toBeDisabled()
  await tickChecklist(team)
  await approve.click()
  await expect(team.getByRole('status')).toHaveText(`Cadastro de ${name} aprovado.`)
  const history = team.getByRole('region', { name: 'Histórico' }).first()
  await expect(history.getByRole('row').nth(1)).toContainText('Aprovado')
  await team.context().close()

  const mail = await latestMail(email, /Seu cadastro foi verificado/)
  expect(mail).toContain('Convide pacientes por email ou por link.')

  await signIn(page, email)
  await expect(page).toHaveURL('/pro')
  await page
    .getByRole('button', { name: /Notificações/ })
    .first()
    .click()
  await expect(
    page.getByText('Seu cadastro foi verificado. Você já pode convidar pacientes.'),
  ).toBeVisible()
})

test('the team rejects with a reason that reaches the professional by email', async ({
  page,
  browser,
}) => {
  const name = uniqueName('Rafael Lima')
  const email = uniqueEmail('rejected')
  await registeredProfessional(email, password, name)
  await readyForReview(email, password)

  const team = await teamPage(browser)
  await openReview(team, name)
  await team.getByRole('button', { name: 'Recusar' }).click()
  await team.getByLabel(`Motivo da recusa para ${name}`).fill('A carteira está ilegível.')
  await team.getByRole('button', { name: 'Confirmar recusa' }).click()
  await expect(team.getByRole('status')).toHaveText(`Cadastro de ${name} recusado.`)
  await team.context().close()

  const mail = await latestMail(email, /Seu cadastro não foi aprovado/)
  expect(mail).toContain('A carteira está ilegível.')

  await signIn(page, email)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Não conseguimos verificar seu cadastro.' }),
  ).toBeVisible()
  await expect(page.getByText('A carteira está ilegível.')).toBeVisible()
})

test('a verified professional sees the name and photo locked in settings', async ({ page }) => {
  const name = uniqueName('Helena Prado')
  const email = uniqueEmail('locked')
  await verifiedProfessional(email, password, name)
  await signIn(page, email)

  await page.goto('/pro/settings')
  const main = page.getByRole('main')
  await expect(main.getByRole('img', { name: `Foto de ${name}` })).toBeVisible()
  await expect(main.getByText('Conferida na verificação.')).toBeVisible()
  await expect(main.getByRole('button', { name: 'Foto do perfil' })).toHaveCount(0)
  await expect(
    main.getByRole('button', { name: /alterar nome exibido aos pacientes/i }),
  ).toHaveCount(0)
  await expect(main.getByText(name, { exact: true })).toBeVisible()
  await main.getByRole('link', { name: 'fale com o suporte' }).click()
  await expect(page).toHaveURL('/pro/support/new')
})

test('rejecting a verified professional ends the link and tells the patient neutrally', async ({
  page,
  browser,
}) => {
  test.slow()
  const name = uniqueName('Helena Prado')
  const professional = uniqueEmail('revoked')
  await verifiedProfessional(professional, password, name)
  const patient = uniqueEmail('revoked-patient')
  await createUser(patient, password)
  await finishOnboarding(patient, password)
  const { code } = await inviteByLink(professional, password)
  await acceptInvitation(patient, password, code)

  const team = await teamPage(browser)
  await team.goto('/admin/professionals?status=verified')
  await team.getByRole('link', { name: `Revisar cadastro de ${name}` }).click()
  await team.getByRole('button', { name: 'Recusar' }).click()
  await team.getByLabel(`Motivo da recusa para ${name}`).fill('Registro cancelado no conselho.')
  await team.getByRole('button', { name: 'Confirmar recusa' }).click()
  const dialog = team.getByRole('alertdialog', { name: `Recusar ${name}?` })
  await expect(dialog).toContainText('1 vínculo ativo é encerrado')
  await expect(dialog).toContainText('aviso neutro')
  await dialog.getByRole('button', { name: 'Recusar e encerrar' }).click()
  await expect(team.getByRole('status')).toHaveText(`Cadastro de ${name} recusado.`)
  await team.context().close()

  await signIn(page, patient)
  await page.goto('/me/professionals')
  await expect(page.getByRole('main')).not.toContainText(name)
  await page.goto('/notifications')
  await expect(page.getByText(`${name} não está mais disponível no MyCogniAI.`)).toBeVisible()
})

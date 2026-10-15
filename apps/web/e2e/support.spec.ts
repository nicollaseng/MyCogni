import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { finishOnboarding, rename, verifiedProfessional } from './support/api'
import { latestMail } from './support/mailpit'
import { signedOut } from './support/session'
import { createUser, makeAdmin, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'suporte-e2e-2026'

const photo = fileURLToPath(new URL('./fixtures/photo.png', import.meta.url))

const message = 'Quando abro o app pelo celular, a tela de registros fica em branco.'

async function signIn(page: Page, email: string) {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL('/sign-in')
}

async function adminPage(browser: Browser): Promise<Page> {
  const email = uniqueEmail('support-admin')
  await makeAdmin(await createUser(email, password))
  const context = await browser.newContext({ storageState: signedOut, locale: 'pt-BR' })
  const page = await context.newPage()
  await signIn(page, email)
  return page
}

function ticketNumberIn(text: string): string {
  const number = /#(\d+)/.exec(text)?.[1]
  if (number === undefined) {
    throw new Error(`No ticket number in ${text}`)
  }
  return number
}

async function openTicketAsAdmin(team: Page, number: string, status: string) {
  await team.goto(`/admin/support?status=${status}`)
  await team.getByRole('searchbox', { name: 'Buscar chamados' }).fill(number)
  await team
    .getByRole('row', { name: `#${number}` })
    .getByRole('link', { name: `#${number}` })
    .click()
  await expect(team.getByText(`#${number}`).first()).toBeVisible()
}

test('a patient opens a ticket with a photo and follows it until the team closes it', async ({
  page,
  browser,
}) => {
  test.setTimeout(90_000)
  const email = uniqueEmail('support-patient')
  await createUser(email, password)
  await finishOnboarding(email, password)
  await rename(email, password, 'Marina Alves')
  await signIn(page, email)

  await page.getByRole('button', { name: 'Sua conta' }).click()
  await page.getByRole('menuitem', { name: 'Suporte' }).click()
  await expect(page).toHaveURL('/me#support')
  await page.getByRole('link', { name: 'Novo chamado' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Falar com o suporte' })).toBeVisible()

  await page.getByRole('button', { name: 'Enviar' }).click()
  await expect(page.getByText('Escolha um assunto.')).toBeVisible()

  await page.getByLabel('Assunto').selectOption('other')
  await page.getByLabel('Qual é o assunto?').fill('Tela em branco')
  await page.getByLabel('Mensagem').fill(message)
  await page.getByLabel('Escolher arquivo').setInputFiles(photo)
  await expect(page.getByText('photo.png')).toBeVisible()
  await page.getByRole('button', { name: 'Enviar' }).click()

  const sent = page.getByRole('heading', { level: 2, name: /^Chamado #\d+ aberto$/ })
  await expect(sent).toBeVisible()
  const number = ticketNumberIn((await sent.textContent()) ?? '')
  await expect(page.getByText('Pendente')).toBeVisible()
  await expect(page.getByText(`Enviamos uma confirmação para ${email}.`)).toBeVisible()
  const confirmation = await latestMail(email, new RegExp(`^Recebemos seu chamado #${number}$`))
  expect(confirmation).toContain('Situação: Pendente')
  expect(confirmation).not.toContain(message)

  await page.getByRole('link', { name: 'Ver chamado' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Tela em branco' })).toBeVisible()
  const steps = page.getByRole('list', { name: 'Andamento' })
  await expect(steps.getByRole('listitem').nth(0)).toHaveAttribute('aria-current', 'step')
  await expect(page.getByText(message)).toBeVisible()
  await expect(page.getByText('photo.png')).toBeVisible()

  const team = await adminPage(browser)
  await openTicketAsAdmin(team, number, 'pending')
  await expect(team.getByText('Marina Alves')).toBeVisible()
  const open = team.getByRole('link', { name: 'Abrir o anexo photo.png em nova aba' })
  const redirect = await team.request.get((await open.getAttribute('href')) ?? '', {
    maxRedirects: 0,
  })
  expect(redirect.status()).toBe(303)
  expect(redirect.headers().location).toMatch(/\/storage\/v1\/object\/sign\/support-attachments\//)
  await team.getByRole('button', { name: 'Assumir' }).click()
  await expect(team.getByRole('status')).toHaveText(
    `Chamado #${number} em andamento. A pessoa foi avisada.`,
  )

  await latestMail(email, new RegExp(`^Seu chamado #${number} está em andamento$`))
  await page.reload()
  await page.getByRole('button', { name: 'Notificações, 1 não lida' }).click()
  await page
    .getByRole('menuitem', { name: new RegExp(`Seu chamado #${number} está em andamento`) })
    .click()
  await expect(page).toHaveURL(new RegExp('/support/'))
  await expect(steps.getByRole('listitem').nth(1)).toHaveAttribute('aria-current', 'step')

  await team.getByRole('button', { name: 'Fechar chamado' }).click()
  await team.getByLabel('Mensagem para a pessoa (opcional)').fill('Corrigimos a tela de registros.')
  await team.getByRole('button', { name: 'Confirmar fechamento' }).click()
  await expect(team.getByRole('status')).toHaveText(
    `Chamado #${number} fechado. A pessoa foi avisada.`,
  )
  await expect(team.getByText('Este chamado está fechado.')).toBeVisible()
  await team.context().close()

  const closed = await latestMail(email, new RegExp(`^Seu chamado #${number} foi fechado$`))
  expect(closed).toContain('Corrigimos a tela de registros.')
  await page.reload()
  await expect(steps.getByRole('listitem').nth(2)).toHaveAttribute('aria-current', 'step')
  await expect(page.getByText('Corrigimos a tela de registros.')).toBeVisible()
})

test('a professional opens a ticket from the professional menu', async ({ page, isMobile }) => {
  const name = `Helena Prado ${randomUUID().slice(0, 6)}`
  const email = uniqueEmail('support-pro')
  await verifiedProfessional(email, password, name)
  await signIn(page, email)
  await page.goto('/pro')

  if (isMobile) {
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await page.getByRole('link', { name: 'Suporte' }).click()
  } else {
    await page.getByRole('button', { name: new RegExp(name) }).click()
    await page.getByRole('menuitem', { name: 'Suporte' }).click()
  }
  await expect(page).toHaveURL('/pro/settings#support')
  await expect(page.getByText('Você ainda não abriu nenhum chamado.')).toBeVisible()
  await page.getByRole('link', { name: 'Novo chamado' }).click()

  await page.getByLabel('Assunto').selectOption('professional')
  await page.getByLabel('Mensagem').fill('Preciso trocar o registro do conselho no meu cadastro.')
  await page.getByRole('button', { name: 'Enviar' }).click()

  const sent = page.getByRole('heading', { level: 2, name: /^Chamado #\d+ aberto$/ })
  await expect(sent).toBeVisible()
  const number = ticketNumberIn((await sent.textContent()) ?? '')
  const confirmation = await latestMail(email, new RegExp(`^Recebemos seu chamado #${number}$`))
  expect(confirmation).toContain('/pro/support/')

  await page.getByRole('link', { name: 'Ver chamado' }).click()
  await expect(page).toHaveURL(/\/pro\/support\//)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Profissional e vínculo' }),
  ).toBeVisible()
  await page.goto('/pro/settings#support')
  await expect(page.getByRole('link', { name: `Abrir chamado #${number}` })).toBeVisible()
})

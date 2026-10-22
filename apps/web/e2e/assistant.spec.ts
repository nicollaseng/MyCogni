import { expect, test, type Locator, type Page } from '@playwright/test'
import {
  acceptInvitation,
  allowSummaries,
  finishOnboarding,
  inviteByLink,
  recordCheckIns,
  verifiedProfessional,
} from './support/api'
import { pageBody } from './support/mybook'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'perguntar-e2e-2026'

const checkIns = Array.from({ length: 3 }, () => ({
  moodLevel: 4,
  emotions: ['calm'],
  contexts: ['exercise'],
  note: null,
}))

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/sign-in/)
}

async function readyPerson(prefix: string): Promise<{ email: string; id: string }> {
  const email = uniqueEmail(prefix)
  const id = await createUser(email, password)
  await finishOnboarding(email, password)
  await recordCheckIns(email, password, checkIns)
  return { email, id }
}

async function expectDisclaimer(chat: Locator, lines: readonly string[]): Promise<void> {
  const note = chat.locator('p').filter({ hasText: lines[0] })
  await expect(note).toHaveCSS('text-align', 'center')
  await expect(note.locator('span')).toHaveText([...lines])
  const [top = 0, bottom = 0] = await note.evaluate((element) =>
    Array.from(element.querySelectorAll('span'), (line) => line.getBoundingClientRect().top),
  )
  expect(bottom).toBeGreaterThan(top)
}

const launcher = 'Conversar com o Cogni'

async function openChat(page: Page) {
  await page.getByRole('button', { name: launcher }).click()
  const chat = page.getByRole('dialog')
  await expect(chat.getByRole('heading', { level: 2 })).toHaveText('Cogni')
  return chat
}

async function ask(chat: Locator, text: string, replies: number): Promise<void> {
  await chat.getByRole('textbox', { name: 'Mensagem' }).fill(text)
  await chat.getByRole('textbox', { name: 'Mensagem' }).press('Enter')
  await expect(chat.locator('[data-role="assistant"]')).toHaveCount(replies)
}

test('asks about the records after allowing it and gets an answer', async ({ page }) => {
  const person = await readyPerson('perguntar')
  await signIn(page, person.email)

  await expect(page.getByRole('button', { name: launcher })).toHaveCount(0)
  await page.goto('/patterns')
  await expect(page.getByRole('button', { name: launcher })).toHaveText('Conversar')
  const chat = await openChat(page)
  await expectDisclaimer(chat, [
    'IA pode cometer erros',
    'MyCogniAI não substitui um aconselhamento de saúde profissional.',
  ])
  await expect(chat.getByRole('button', { name: 'Ajuda agora' })).toHaveCount(0)
  const consent = chat.getByRole('region', { name: 'Posso ler os seus registros?' })
  await consent.getByRole('button', { name: 'Permitir' }).click()
  await expect(consent).toHaveCount(0)

  await chat.getByRole('textbox', { name: 'Mensagem' }).fill('Como foi minha semana?')
  await chat.getByRole('button', { name: 'Enviar' }).click()

  const log = chat.getByRole('log')
  await expect(log).toContainText('Como foi minha semana?')
  await expect(log).toContainText('aparecem 3 check-ins')
  await expect(chat.getByRole('region', { name: 'Apoio agora' })).toHaveCount(0)
  await expect(chat.getByRole('heading', { level: 2 })).toHaveText('Como foi minha semana?')
})

test('keeps conversations in a history to reopen, delete and start again', async ({ page }) => {
  const person = await readyPerson('historico')
  await signIn(page, person.email)
  await page.goto('/entries')
  const chat = await openChat(page)
  await chat.getByRole('button', { name: 'Agora não' }).click()
  const title = chat.getByRole('heading', { level: 2 })
  const fresh = chat.getByRole('button', { name: 'Nova conversa' })

  await expect(fresh).toHaveAttribute('aria-disabled', 'true')
  await ask(chat, 'Por que durmo mal antes das reuniões de segunda?', 1)
  await expect(title).toHaveText('Por que durmo mal antes das reuniões de…')
  await fresh.click()
  await expect(title).toHaveText('Cogni')
  await ask(chat, 'O que fazer na pausa do almoço?', 1)

  await chat.getByRole('button', { name: 'Conversas' }).click()
  await expect(title).toHaveText('Conversas')
  const today = chat.getByRole('region', { name: 'Hoje' })
  await expect(today.getByRole('listitem')).toHaveCount(2)
  await today
    .getByRole('button', { name: 'Por que durmo mal antes das reuniões de…', exact: true })
    .click()
  await expect(title).toHaveText('Por que durmo mal antes das reuniões de…')
  await expect(chat.getByRole('log')).toContainText(
    'Por que durmo mal antes das reuniões de segunda?',
  )

  await chat.getByRole('button', { name: 'Conversas' }).click()
  await today
    .getByRole('button', { name: 'Mais opções para O que fazer na pausa do almoço?' })
    .click()
  await chat.getByRole('menuitem', { name: 'Apagar' }).click()
  const confirm = chat.getByRole('alertdialog', { name: 'Apagar esta conversa?' })
  await expect(confirm.getByRole('button', { name: 'Cancelar' })).toBeFocused()
  await confirm.getByRole('button', { name: 'Apagar' }).click()
  await expect(today.getByRole('listitem')).toHaveCount(1)

  await page.keyboard.press('Escape')
  await expect(title).toHaveText('Por que durmo mal antes das reuniões de…')
  await page.keyboard.press('Escape')
  await expect(chat).toHaveCount(0)

  await page.reload()
  const again = await openChat(page)
  await again.getByRole('button', { name: 'Conversas' }).click()
  await expect(again.getByRole('listitem')).toHaveCount(1)
  await again.getByRole('button', { name: 'Nova conversa' }).click()
  await expect(again.getByRole('heading', { level: 2 })).toHaveText('Cogni')
  await expect(again.getByRole('textbox', { name: 'Mensagem' })).toBeFocused()
})

test('introduces Cogni once and offers a breathing minute under its answer', async ({ page }) => {
  const person = await readyPerson('cogni')
  await signIn(page, person.email)
  await page.goto('/entries')
  const intro =
    'Oi, eu sou o Cogni, seu parceiro virtual. Posso olhar seus registros com você ou só ouvir como foi o seu dia.'

  const chat = await openChat(page)
  await expect(chat.locator('[data-role="intro"]')).toHaveText(`Cogni: ${intro}`)
  await chat.getByRole('button', { name: 'Fechar' }).click()
  await expect(chat).toHaveCount(0)
  const again = await openChat(page)
  await expect(again.getByText(intro)).toHaveCount(0)
  await again.getByRole('button', { name: 'Agora não' }).click()

  await ask(again, 'Estou tenso depois do trabalho', 1)
  const reply = again.locator('[data-role="assistant"]')
  await expect(reply).toContainText('O que acha de começar com um minuto de respiração?')
  const suggestions = reply.getByRole('group', { name: 'Sugestões do Cogni' })
  await suggestions.getByRole('button', { name: 'Respirar 1 minuto' }).click()

  const breathing = page.getByRole('dialog', { name: 'Respirar em quadrado' })
  await expect(breathing).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(breathing).toHaveCount(0)
  await expect(again).toBeVisible()
  await expect(suggestions.getByRole('button', { name: 'Respirar 1 minuto' })).toBeFocused()
})

test('answers a crisis message with the crisis card once, next to that answer', async ({
  page,
}) => {
  const person = await readyPerson('crise')
  await signIn(page, person.email)
  await page.goto('/entries')
  const chat = await openChat(page)
  await chat.getByRole('button', { name: 'Agora não' }).click()

  await chat.getByRole('textbox', { name: 'Mensagem' }).fill('Vontade de morrer')
  await chat.getByRole('textbox', { name: 'Mensagem' }).press('Enter')

  const notice = chat.locator('[data-role="notice"]')
  await expect(notice).toContainText(
    'Que bom que você me contou: você está em segurança agora? Ligue para um dos contatos abaixo.',
  )
  const card = notice.getByRole('region', { name: 'Apoio agora' })
  await expect(card).not.toContainText('Você não precisa passar por isso sem apoio')
  await expect(card.getByRole('link', { name: '188 CVV' })).toHaveAttribute('href', 'tel:188')
  await expect(chat.getByRole('region', { name: 'Apoio agora' })).toHaveCount(1)
})

test('puts the safety of a friend first and shows the numbers once', async ({ page }) => {
  const person = await readyPerson('amigo')
  await signIn(page, person.email)
  await page.goto('/entries')
  const chat = await openChat(page)
  await chat.getByRole('button', { name: 'Agora não' }).click()

  await chat.getByRole('textbox', { name: 'Mensagem' }).fill('Meu amigo teve vontade de se matar')
  await chat.getByRole('textbox', { name: 'Mensagem' }).press('Enter')

  const reply = chat.locator('[data-role="assistant"]')
  await expect(reply).toContainText('Ele está em perigo agora?')
  await expect(reply).toContainText('contatos abaixo')
  await expect(reply).not.toContainText('Como você está se sentindo')
  const card = reply.getByRole('region', { name: 'Apoio agora' })
  await expect(card.getByRole('link', { name: '188 CVV' })).toHaveAttribute('href', 'tel:188')
  await expect(card.getByRole('link', { name: '192 SAMU' })).toHaveAttribute('href', 'tel:192')
  await expect(chat.getByRole('region', { name: 'Apoio agora' })).toHaveCount(1)
})

test('lets a professional ask about a linked patient', async ({ page }) => {
  const professionalEmail = uniqueEmail('pro-perguntar')
  await verifiedProfessional(professionalEmail, password, 'Dra. Helena Prado')
  const patient = await readyPerson('paciente-perguntar')
  await allowSummaries(patient.email, password)
  const { code } = await inviteByLink(professionalEmail, password)
  await acceptInvitation(patient.email, password, code)
  await signIn(page, professionalEmail)
  await page.goto(`/pro/patients/${patient.id}`)

  await page.getByRole('button', { name: 'Perguntar sobre este paciente' }).click()
  const chat = page.getByRole('dialog')
  await expect(chat.getByText(/^Sobre /)).toBeVisible()
  await expect(chat.getByRole('button', { name: 'Conversas' })).toBeVisible()
  await expectDisclaimer(chat, [
    'IA pode cometer erros',
    'MyCogniAI não substitui o seu julgamento clínico.',
  ])
  await chat.getByRole('button', { name: 'Como o humor mudou nas últimas semanas?' }).click()

  await expect(chat.getByRole('log')).toContainText('aparecem 3 check-ins')
  await chat.getByRole('button', { name: 'Conversas' }).click()
  await expect(
    chat.getByRole('button', { name: 'Como o humor mudou nas últimas semanas?', exact: true }),
  ).toBeVisible()
})

test('asks about the MyBook page being written from its editor', async ({ page }) => {
  const person = await readyPerson('pagina')
  await signIn(page, person.email)
  await page.goto('/mybook')
  await page.getByRole('button', { name: 'Nova página' }).click()
  await expect(page).toHaveURL(/\/mybook\/[0-9a-f-]{36}$/)
  await page.getByLabel('Título da página').fill('Domingo no parque')
  await pageBody(page).click()
  await page.keyboard.type('Fui ao parque com a minha irmã.')

  await page.getByRole('button', { name: launcher }).click()
  const chat = page.getByRole('dialog')
  await expect(chat).toContainText('Sobre esta página')
  const consent = chat.getByRole('region', { name: 'Posso ler os seus registros?' })
  await expect(consent.getByRole('checkbox', { name: 'Ler também o MyBook' })).toBeChecked()
  await consent.getByRole('button', { name: 'Permitir' }).click()
  await chat.getByRole('button', { name: 'Resuma esta página' }).click()

  await expect(chat.getByRole('log')).toContainText(
    'Sua página “Domingo no parque” fala de um momento que você quis guardar.',
  )
  await chat.getByRole('button', { name: 'Nova conversa' }).click()
  await chat.getByRole('button', { name: 'Conversas' }).click()
  await chat.getByRole('button', { name: 'Resuma esta página', exact: true }).click()
  await expect(chat.getByRole('heading', { level: 2 })).toHaveText('Resuma esta página')
  await expect(chat).toContainText('Sobre esta página')
  await chat.getByRole('button', { name: 'Fechar' }).click()
  await expect(page.getByLabel('Título da página')).toHaveValue('Domingo no parque')
  await expect(pageBody(page)).toContainText('Fui ao parque com a minha irmã.')
})

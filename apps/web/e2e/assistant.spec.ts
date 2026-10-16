import { expect, test, type Page } from '@playwright/test'
import {
  acceptInvitation,
  allowSummaries,
  finishOnboarding,
  inviteByLink,
  recordCheckIns,
  verifiedProfessional,
} from './support/api'
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

async function openChat(page: Page) {
  await page.getByRole('button', { name: 'Perguntar', exact: true }).click()
  return page.getByRole('dialog', { name: 'Perguntar' })
}

test('asks about the records after allowing it and gets an answer', async ({ page }) => {
  const person = await readyPerson('perguntar')
  await signIn(page, person.email)

  await expect(page.getByRole('button', { name: 'Perguntar', exact: true })).toHaveCount(0)
  await page.goto('/patterns')
  const chat = await openChat(page)
  await expect(chat).toContainText(
    'IA pode cometer erros. Essa conversa não substitui um aconselhamento de saúde profissional.',
  )
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
  await chat.getByRole('button', { name: 'Conversas' }).click()
  await expect(chat.getByRole('menuitem', { name: /Como foi minha semana\?/ })).toBeVisible()
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
    'Que bom que você me contou. Você merece o apoio de uma pessoa agora: ligue para um dos contatos abaixo.',
  )
  const card = notice.getByRole('region', { name: 'Apoio agora' })
  await expect(card).not.toContainText('Você não precisa passar por isso sem apoio')
  await expect(card.getByRole('link', { name: '188 CVV' })).toHaveAttribute('href', 'tel:188')
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
  const chat = page.getByRole('dialog', { name: /^Perguntar sobre / })
  await expect(chat).toContainText('IA pode cometer erros. Não substitui o seu julgamento clínico.')
  await chat.getByRole('button', { name: 'Como o humor mudou nas últimas semanas?' }).click()

  await expect(chat.getByRole('log')).toContainText('aparecem 3 check-ins')
})

import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import {
  claimInvitation,
  finishOnboarding,
  inviteByLink,
  verifiedProfessional,
} from './support/api'
import { notifyInsight, seedPatientInsight } from './support/database'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

const password = 'conta-e2e-2026'

async function signInAsReadyPerson(page: Page): Promise<{ id: string; email: string }> {
  const email = uniqueEmail('conta')
  const id = await createUser(email, password)
  await finishOnboarding(email, password)
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/today')
  return { id, email }
}

test('opens the account menu from the header and goes to the settings', async ({ page }) => {
  await page.goto('/today')

  const account = page.getByRole('button', { name: 'Sua conta' })
  await account.click()

  await expect(account).toHaveAttribute('aria-expanded', 'true')
  const menu = page.getByRole('menu', { name: 'Conta' })
  await expect(menu.getByRole('menuitem')).toHaveText([
    'Perfil e configurações',
    'Profissionais',
    'Suporte',
    'Ajuda agora',
    'Sair',
  ])
  await menu.getByRole('menuitem', { name: 'Perfil e configurações' }).click()

  await expect(page).toHaveURL('/me')
  await expect(page.getByRole('region', { name: 'Preferências' })).toBeVisible()
  await expect(menu).toHaveCount(0)
})

test('shows the crisis lines from the account menu and closes with Escape', async ({ page }) => {
  await page.goto('/entries')

  const account = page.getByRole('button', { name: 'Sua conta' })
  await account.click()
  await page.getByRole('menuitem', { name: 'Ajuda agora' }).click()

  await expect(page.getByRole('menuitem', { name: /^188/ })).toHaveAttribute('href', 'tel:188')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu', { name: 'Conta' })).toHaveCount(0)
  await expect(account).toBeFocused()
})

test.describe('a person with their own session', () => {
  test.use({ storageState: signedOut })

  test('signs out from the account menu', async ({ page }) => {
    const { email } = await signInAsReadyPerson(page)

    await page.getByRole('button', { name: 'Sua conta' }).click()
    await expect(page.getByRole('menu', { name: 'Conta' })).toBeVisible()
    await expect(page.getByText(email)).toBeVisible()
    await page.getByRole('menuitem', { name: 'Sair' }).click()

    await expect(page).toHaveURL('/')
    await page.goto('/today')
    await expect(page).toHaveURL('/sign-in')
  })

  test('opens an invitation from the bell and reads it', async ({ page }) => {
    const name = `Helena Prado ${randomUUID().slice(0, 6)}`
    const professional = uniqueEmail('pro')
    await verifiedProfessional(professional, password, name)
    const { code } = await inviteByLink(professional, password)
    const patient = uniqueEmail('sino')
    await createUser(patient, password)
    await finishOnboarding(patient, password)
    await claimInvitation(patient, password, code)
    await page.goto('/sign-in')
    await page.getByLabel('Email').fill(patient)
    await page.getByLabel('Senha').fill(password)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL('/today')

    const bell = page.getByRole('button', { name: 'Notificações, 1 não lida' })
    await bell.click()
    await expect(page).toHaveURL('/today')
    const menu = page.getByRole('menu', { name: 'Notificações' })
    await expect(menu.getByRole('menuitem', { name: 'Ver todas' })).toHaveAttribute(
      'href',
      '/notifications',
    )
    await menu
      .getByRole('menuitem', { name: `${name} convidou você para acompanhar seus registros.` })
      .click()

    await expect(page).toHaveURL(/\/invites\/[0-9a-f-]{36}$/)
    await expect(
      page.getByRole('heading', { level: 1, name: `${name} quer acompanhar seus registros.` }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Notificações', exact: true })).toBeVisible()
  })

  test('opens the reading of a weekly summary from its notification', async ({ page }) => {
    const { id } = await signInAsReadyPerson(page)
    const earlier = {
      summary: 'Semana mais tranquila, com o sono em dia.',
      highlights: ['As caminhadas apareceram nos dias melhores.'],
      suggestions: [],
    }
    const earlierId = await seedPatientInsight({
      patientId: id,
      daysAgo: 9,
      checkInCount: 7,
      content: earlier,
    })
    await seedPatientInsight({
      patientId: id,
      daysAgo: 1,
      checkInCount: 7,
      content: { summary: 'Semana estável.', highlights: [], suggestions: [] },
    })
    await notifyInsight(id, earlierId)
    await page.reload()

    await page.getByRole('button', { name: 'Notificações, 1 não lida' }).click()
    await page.getByRole('menuitem', { name: /Seu resumo da semana está pronto/ }).click()

    await expect(page).toHaveURL(`/patterns#reading-${earlierId}`)
    await expect(page.locator(`#reading-${earlierId}`).getByRole('button')).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    await expect(page.getByText(earlier.summary)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Notificações', exact: true })).toBeVisible()
  })

  test('says there is nothing new in the bell', async ({ page }) => {
    await signInAsReadyPerson(page)

    await page.getByRole('button', { name: 'Notificações', exact: true }).click()

    await expect(page.getByText('Nada por aqui por enquanto.')).toBeVisible()
    await page.mouse.click(5, 300)
    await expect(page.getByText('Nada por aqui por enquanto.')).toHaveCount(0)
  })
})

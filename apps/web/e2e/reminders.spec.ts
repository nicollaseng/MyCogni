import { expect, test, type Page } from '@playwright/test'
import { finishOnboarding, setReminders } from './support/api'
import { latestMail } from './support/mailpit'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'lembretes-2026'

async function signInAsReadyPerson(page: Page): Promise<string> {
  const email = uniqueEmail('lembretes')
  await createUser(email, password)
  await finishOnboarding(email, password)
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/today')
  return email
}

async function reminderMail(email: string): Promise<string> {
  let text = ''
  await expect
    .poll(
      async () => {
        text = await latestMail(email, /^Hora da sua pausa$/).catch(() => '')
        return text
      },
      { timeout: 45_000 },
    )
    .not.toBe('')
  return text
}

function nowInSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date())
}

test('sets a reminder time and the days, and keeps them', async ({ page }) => {
  await signInAsReadyPerson(page)
  await page.goto('/me/reminders')
  await expect(page.getByRole('heading', { level: 1, name: 'Lembretes' })).toBeVisible()

  await page.getByRole('switch', { name: 'Lembrete para praticar' }).click()
  await page.getByLabel('Horário').fill('07:45')
  await page.getByRole('button', { name: 'Domingo' }).click()
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('main').getByRole('status').last()).toHaveText('Lembrete salvo.')

  await page.reload()
  await expect(page.getByRole('switch', { name: 'Lembrete para praticar' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await expect(page.getByLabel('Horário')).toHaveValue('07:45')
  await expect(page.getByRole('button', { name: 'Domingo' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect(page.getByRole('button', { name: 'Segunda-feira' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByRole('switch', { name: 'Email' })).toHaveAttribute('aria-checked', 'true')
})

test('emails the reminder at its time and the link in it turns email off', async ({ page }) => {
  test.slow()
  const email = await signInAsReadyPerson(page)
  await setReminders(email, password, {
    enabled: true,
    time: nowInSaoPaulo(),
    days: [0, 1, 2, 3, 4, 5, 6],
    push: false,
    email: true,
  })

  const text = await reminderMail(email)
  expect(text).toContain('Que tal alguns minutos para você?')
  const link = /(https?:\/\/\S+\/reminders\/email-off\?token=\S+)/.exec(text)?.[1]
  expect(link).toBeDefined()
  const { pathname, search } = new URL(link ?? 'http://localhost/')

  await page.goto('/notifications')
  await expect(
    page.getByText('Hora da sua pausa. Que tal alguns minutos para você?').first(),
  ).toBeVisible()

  await page.goto(`${pathname}${search}`)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Lembretes por email desligados' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Abrir lembretes' }).click()
  await expect(page).toHaveURL('/me/reminders')
  await expect(page.getByRole('switch', { name: 'Email' })).toHaveAttribute('aria-checked', 'false')
})

test('says when an email link is not valid', async ({ page }) => {
  await page.goto('/reminders/email-off?token=not-a-real-token')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Este link não funcionou' }),
  ).toBeVisible()
})

test('offers a daily reminder at the end of a breathing practice', async ({ page }) => {
  await signInAsReadyPerson(page)
  await page.clock.install()
  await page.goto('/zen')

  await page.getByRole('button', { name: 'Respirar 1 min' }).click()
  const mode = page.getByRole('dialog', { name: 'Respirar em quadrado' })
  await mode.getByRole('button', { name: 'Começar' }).click()
  await page.clock.fastForward('01:20')

  const offer = mode.getByRole('region', { name: 'Quer um lembrete diário para praticar?' })
  const feeling = mode.getByRole('group', { name: 'Como você está agora?' })
  await expect(feeling).toBeVisible()
  await expect(offer).toHaveCount(0)
  await feeling.getByRole('button', { name: 'Bem', exact: true }).click()
  await expect(feeling).toHaveCount(0)
  await expect(offer).toBeVisible()
  await offer.getByLabel('Horário do lembrete').fill('08:10')
  await offer.getByRole('button', { name: 'Lembrar todo dia' }).click()
  await expect(mode.getByText('Combinado. Lembramos você às 08:10.')).toBeVisible()

  await mode.getByRole('link', { name: 'Ajustar lembretes' }).click()
  await expect(page).toHaveURL('/me/reminders')
  await expect(page.getByLabel('Horário')).toHaveValue('08:10')
})

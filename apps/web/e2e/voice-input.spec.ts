import { expect, test, type Page } from '@playwright/test'
import { finishOnboarding } from './support/api'
import { installSyntheticMicrophone } from './support/microphone'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'falar-com-cogni-2026'

const spoken = 'Hoje eu acordei cansado e com a cabeça cheia.'

async function signInAsReadyPerson(page: Page): Promise<void> {
  await installSyntheticMicrophone(page)
  const email = uniqueEmail('voz')
  await createUser(email, password)
  await finishOnboarding(email, password)
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/today')
}

test('speaks to Cogni: reviews a transcription, sends one directly and cancels one', async ({
  page,
}) => {
  await signInAsReadyPerson(page)
  await page.goto('/patterns')
  await page.getByRole('button', { name: 'Conversar com o Cogni' }).click()
  const chat = page.getByRole('dialog')
  await expect(chat.getByRole('heading', { level: 2 })).toHaveText('Cogni')
  const field = chat.getByRole('textbox', { name: 'Mensagem' })
  const log = chat.getByRole('log')

  await chat.getByRole('button', { name: 'Falar' }).click()
  const recording = chat.getByRole('group', { name: 'Gravando' })
  await expect(recording.getByTestId('voice-waveform')).toBeVisible()
  await expect(recording.getByRole('button', { name: 'Cancelar gravação' })).toBeVisible()
  await expect(recording.locator('[data-active="true"]').first()).toBeAttached({ timeout: 10_000 })
  await page.waitForTimeout(800)
  await recording.getByRole('button', { name: 'Parar e revisar' }).click()
  await expect(field).toHaveValue(spoken)
  await expect(field).toBeFocused()
  await field.press('End')
  await field.pressSequentially(' Obrigado.')
  await chat.getByRole('button', { name: 'Enviar' }).click()
  await expect(log).toContainText(`${spoken} Obrigado.`)
  await expect(log.getByText('Escrevendo a resposta…')).toHaveCount(0, { timeout: 30_000 })

  await chat.getByRole('button', { name: 'Falar' }).click()
  await expect(chat.getByRole('group', { name: 'Gravando' })).toBeVisible()
  await page.waitForTimeout(800)
  await chat.getByRole('button', { name: 'Enviar' }).click()
  await expect(log.getByText(spoken, { exact: true })).toBeVisible()
  await expect(field).toHaveValue('')
  await expect(log.getByText('Escrevendo a resposta…')).toHaveCount(0, { timeout: 30_000 })

  const before = await log.getByText(spoken).count()
  await chat.getByRole('button', { name: 'Falar' }).click()
  await expect(chat.getByRole('group', { name: 'Gravando' })).toBeVisible()
  await chat.getByRole('button', { name: 'Cancelar gravação' }).click()
  await expect(chat.getByRole('group', { name: 'Gravando' })).toHaveCount(0)
  await expect(field).toHaveValue('')
  await expect(chat.getByRole('button', { name: 'Falar' })).toBeFocused()
  expect(await log.getByText(spoken).count()).toBe(before)

  await chat.getByRole('button', { name: 'Falar' }).click()
  await expect(chat.getByRole('group', { name: 'Gravando' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(chat.getByRole('group', { name: 'Gravando' })).toHaveCount(0)
  await expect(chat).toBeVisible()
})

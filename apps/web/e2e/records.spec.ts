import { expect, test } from '@playwright/test'
import {
  acceptInvitation,
  addToCheckIn,
  finishOnboarding,
  inviteByLink,
  recordCheckIns,
  rename,
  verifiedProfessional,
} from './support/api'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'registro-pro-2026'

test('a professional opens a shared record read-only from the patient file', async ({ page }) => {
  const professional = uniqueEmail('pro-registro')
  await verifiedProfessional(professional, password, 'Helena Prado')
  const patientEmail = uniqueEmail('paciente-registro')
  const patientId = await createUser(patientEmail, password)
  await finishOnboarding(patientEmail, password)
  await rename(patientEmail, password, 'Marina Alves')
  const { code } = await inviteByLink(professional, password)
  await acceptInvitation(patientEmail, password, code)
  const [checkInId] = await recordCheckIns(patientEmail, password, [
    {
      moodLevel: 2,
      emotions: ['anxiety'],
      contexts: ['work'],
      note: 'Reunião difícil com a chefia.',
    },
  ])
  await addToCheckIn(patientEmail, password, checkInId ?? '', 'No dia seguinte conversamos melhor.')

  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(professional)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/pro')

  await page.goto(`/pro/patients/${patientId}`)
  const table = page.getByRole('table').filter({ hasText: 'Reunião difícil com a chefia.' })
  await table.getByRole('row').nth(1).getByRole('link').click()

  await expect(page).toHaveURL(`/pro/patients/${patientId}/entries/${checkInId ?? ''}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Um pouco mal' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Emoções' })).toHaveText('ansiedade')
  await expect(page.getByText('Reunião difícil com a chefia.')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Escrito depois' })).toContainText(
    'No dia seguinte conversamos melhor.',
  )
  await expect(page.getByRole('button', { name: 'Escrever mais' })).toHaveCount(0)
  await expect(page.getByText('Somente leitura.', { exact: false })).toBeVisible()

  await page.getByRole('main').getByRole('link', { name: 'Marina Alves' }).click()
  await expect(page).toHaveURL(`/pro/patients/${patientId}`)
})

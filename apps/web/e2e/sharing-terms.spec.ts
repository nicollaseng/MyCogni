import { randomUUID } from 'node:crypto'
import { sharingConsentVersion } from '@mycogni/domain'
import { expect, test, type Page } from '@playwright/test'
import {
  acceptInvitation,
  confirmSharingTerms,
  finishOnboarding,
  inviteByLink,
  rename,
  verifiedProfessional,
} from './support/api'
import { revertSharingTerms } from './support/database'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'termos-e2e-2026'

const notice = 'Atualizamos os termos de compartilhamento.'

function uniqueName(name: string): string {
  return `${name} ${randomUUID().slice(0, 6)}`
}

async function signIn(page: Page, email: string) {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

async function linkOnPreviousTerms(professionalName: string, patientName: string) {
  const professional = uniqueEmail('pro')
  await verifiedProfessional(professional, password, professionalName)
  const patient = uniqueEmail('patient')
  const patientId = await createUser(patient, password)
  await finishOnboarding(patient, password)
  await rename(patient, password, patientName)
  const { code } = await inviteByLink(professional, password)
  await acceptInvitation(patient, password, code)
  await revertSharingTerms(patientId)
  return { professional, patient, patientId }
}

test('a patient reviews the updated sharing terms from Hoje and confirms them', async ({
  page,
}) => {
  const name = uniqueName('Helena Prado')
  const { patient } = await linkOnPreviousTerms(name, uniqueName('Marina Costa'))

  await signIn(page, patient)
  await expect(page).toHaveURL('/today')
  await expect(page.getByText(notice)).toBeVisible()

  await page.goto('/me')
  const professionals = page.getByRole('region', { name: 'Profissionais' })
  const link = professionals.getByRole('listitem').filter({ hasText: name })
  await expect(link.getByRole('link', { name: 'Confirme os novos termos' })).toHaveAttribute(
    'href',
    /^\/me\/professionals\/[0-9a-f-]{36}\/terms$/,
  )

  await page.goto('/today')
  await page.getByRole('link', { name: 'Revise e confirme' }).click()
  await expect(page).toHaveURL(/\/me\/professionals\/[0-9a-f-]{36}\/terms$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Revise e confirme os novos termos.' }),
  ).toBeVisible()
  await expect(page.getByRole('main').getByText(name, { exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'O que mudou' })).toContainText(
    'Perfil e configurações',
  )
  await expect(page.getByRole('region', { name: 'Termos de compartilhamento' })).toContainText(
    `Versão ${sharingConsentVersion}`,
  )
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click()

  await expect(page).toHaveURL('/me#professionals')
  await expect(link).toContainText('Inclui registros anteriores')
  await expect(link.getByRole('link', { name: 'Confirme os novos termos' })).toHaveCount(0)

  await page.goto('/today')
  await expect(page.getByRole('heading', { level: 1, name: 'Como você está agora?' })).toBeVisible()
  await expect(page.getByText(notice)).toHaveCount(0)
})

test('a professional sees the pending terms in the patient file until they are confirmed', async ({
  page,
}) => {
  const patientName = uniqueName('Joana Lima')
  const { professional, patient, patientId } = await linkOnPreviousTerms(
    uniqueName('Rafael Costa'),
    patientName,
  )

  await signIn(page, professional)
  await expect(page).toHaveURL('/pro')
  await page.goto(`/pro/patients/${patientId}`)
  await expect(page.getByRole('heading', { level: 1, name: patientName })).toBeVisible()
  const pending = page.getByText('Aguardando confirmação dos termos atualizados')
  await expect(pending).toBeVisible()

  await confirmSharingTerms(patient, password)
  await page.reload()

  await expect(page.getByRole('heading', { level: 1, name: patientName })).toBeVisible()
  await expect(pending).toHaveCount(0)
})

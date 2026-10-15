import { readFile } from 'node:fs/promises'
import { expect, test, type Download, type Locator, type Page } from '@playwright/test'
import {
  acceptInvitation,
  finishOnboarding,
  inviteByLink,
  recordCheckIns,
  rename,
  verifiedProfessional,
} from './support/api'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'relatorio-e2e-2026'

const checkIns = [
  { moodLevel: 4, emotions: ['calm'], contexts: ['exercise'], note: 'Caminhei antes do trabalho.' },
  { moodLevel: 2, emotions: ['anxiety'], contexts: ['work'], note: null },
]

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/sign-in/)
}

async function readyPatient(prefix: string): Promise<{ email: string; id: string }> {
  const email = uniqueEmail(prefix)
  const id = await createUser(email, password)
  await finishOnboarding(email, password)
  await recordCheckIns(email, password, checkIns)
  return { email, id }
}

async function downloadFrom(page: Page, sheet: Locator): Promise<Download> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    sheet.getByRole('button', { name: 'Baixar PDF' }).click(),
  ])
  return download
}

async function expectPdf(download: Download, fileName: RegExp): Promise<void> {
  expect(download.suggestedFilename()).toMatch(fileName)
  const bytes = await readFile(await download.path())
  expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-')
}

test('exports the mood report from Padrões as a PDF, leaving notes out by default', async ({
  page,
}) => {
  const patient = await readyPatient('relatorio')
  await signIn(page, patient.email)
  await page.goto('/patterns')

  await page.getByRole('button', { name: 'Exportar relatório' }).click()
  const sheet = page.getByRole('dialog', { name: 'Exportar relatório' })
  await expect(sheet.getByRole('switch', { name: 'Suas notas' })).toHaveAttribute(
    'aria-checked',
    'false',
  )
  await sheet.getByText('Últimos 7 dias').click()
  await expect(sheet.getByText('O PDF terá os últimos 7 dias, sem suas notas.')).toBeVisible()

  await expectPdf(await downloadFrom(page, sheet), /^mycogni-relatorio-\d{4}-\d{2}-\d{2}\.pdf$/)
  await expect(sheet).toBeHidden()
})

test('a linked professional downloads the report from the patient file', async ({ page }) => {
  const professional = uniqueEmail('pro-relatorio')
  await verifiedProfessional(professional, password, 'Helena Prado')
  const patient = await readyPatient('paciente-relatorio')
  await rename(patient.email, password, 'Lúcia Prado')
  const { code } = await inviteByLink(professional, password)
  await acceptInvitation(patient.email, password, code)
  await signIn(page, professional)
  await page.goto(`/pro/patients/${patient.id}`)

  await page.getByRole('button', { name: 'Baixar relatório' }).click()
  const sheet = page.getByRole('dialog', { name: 'Baixar relatório' })
  await sheet.getByRole('switch', { name: 'Notas da pessoa' }).click()
  await expect(sheet.getByText('O PDF terá os últimos 30 dias, com as notas.')).toBeVisible()

  await expectPdf(
    await downloadFrom(page, sheet),
    /^mycogni-relatorio-lucia-\d{4}-\d{2}-\d{2}\.pdf$/,
  )
})

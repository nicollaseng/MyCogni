import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { finishOnboarding, verifiedProfessional } from './support/api'
import { latestMail } from './support/mailpit'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'dados-2026'

async function signIn(page: Page, email: string) {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL('/sign-in')
}

async function prepareAndDownload(page: Page): Promise<Buffer> {
  await page.getByRole('button', { name: 'Preparar meus dados' }).click()
  await expect(page.getByText('Preparando seus dados…')).toBeVisible()
  await expect(page.getByText(/^Pronto · .+ · disponível até .+$/)).toBeVisible({
    timeout: 60_000,
  })
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Baixar' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^mycogniai-dados-\d{4}-\d{2}-\d{2}\.zip$/)
  return readFile(await download.path())
}

test('prepares the data, tells the person and downloads the archive', async ({ page }) => {
  test.slow()
  const email = uniqueEmail('dados')
  await createUser(email, password)
  await finishOnboarding(email, password)
  await signIn(page, email)
  await page.goto('/me/privacy')
  await expect(
    page.getByText('Leva alguns minutos. Avisamos por email e aqui quando estiver pronto.'),
  ).toBeVisible()

  const archive = await prepareAndDownload(page)

  expect(archive.subarray(0, 2).toString('latin1')).toBe('PK')
  for (const name of ['LEIA-ME.txt', 'dados.json', 'registros.csv', 'memorias.csv']) {
    expect(archive.includes(name)).toBe(true)
  }
  const mail = await latestMail(email, /^Seus dados estão prontos$/)
  expect(mail).toContain('/me/privacy#data')
  expect(mail).not.toContain('.zip')

  await page.goto('/notifications')
  await expect(page.getByText('Seus dados estão prontos para baixar.').first()).toBeVisible()
  await page.getByRole('link', { name: 'Baixar dados' }).first().click()
  await expect(page).toHaveURL('/me/privacy#data')
  await expect(page.getByRole('button', { name: 'Baixar' })).toBeVisible()
})

test('lets a professional prepare and download their own data', async ({ page }) => {
  test.slow()
  const email = uniqueEmail('dados-pro')
  await verifiedProfessional(email, password, 'Helena Prado')
  await signIn(page, email)
  await page.goto('/pro/settings')

  const archive = await prepareAndDownload(page)

  expect(archive.includes('dados.json')).toBe(true)
})

import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import { councilNumber, readyForReview, registeredProfessional } from './support/api'
import { tickChecklist } from './support/review'
import { signedOut } from './support/session'
import { createUser, makeAdmin, uniqueEmail } from './support/supabase'

const password = 'equipe-e2e-2026'

async function signIn(page: Page, email: string) {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).not.toHaveURL('/sign-in')
}

test.describe('as the MyCogniAI team', () => {
  test.use({ storageState: signedOut })

  test('approves a professional who is waiting for verification', async ({ page }) => {
    const fullName = `Helena Prado ${randomUUID().slice(0, 6)}`
    const number = councilNumber()
    const email = uniqueEmail('pending-pro')
    await registeredProfessional(email, password, fullName, number)
    await readyForReview(email, password)
    const adminEmail = uniqueEmail('admin')
    await makeAdmin(await createUser(adminEmail, password))

    await signIn(page, adminEmail)
    await page.goto('/admin/professionals')

    await expect(page.getByRole('heading', { level: 1, name: 'Profissionais' })).toBeVisible()
    const pending = page.getByRole('row', { name: fullName })
    await expect(pending).toContainText('Psicologia')
    await expect(pending).toContainText(`CRP 06/${number}`)
    await expect(pending).toContainText('Enviada')
    await pending.getByRole('link', { name: `Revisar cadastro de ${fullName}` }).click()

    await expect(page.getByRole('heading', { level: 1, name: fullName })).toBeVisible()
    await tickChecklist(page)
    await page.getByRole('button', { name: 'Aprovar' }).click()
    await expect(page.getByRole('status')).toHaveText(`Cadastro de ${fullName} aprovado.`)

    await page.getByRole('link', { name: 'Profissionais' }).first().click()
    await page.getByRole('link', { name: 'Verificados' }).click()
    await expect(page).toHaveURL('/admin/professionals?status=verified')
    await expect(page.getByRole('row', { name: fullName })).toContainText('Verificado em')
  })

  test('opens the team area from its address', async ({ page }) => {
    const adminEmail = uniqueEmail('admin-entry')
    await makeAdmin(await createUser(adminEmail, password))

    await signIn(page, adminEmail)
    await page.goto('/admin')

    await expect(page).toHaveURL('/admin/professionals')
    await expect(page.getByRole('heading', { level: 1, name: 'Profissionais' })).toBeVisible()
  })
})

test('sends people outside the team away from the review pages', async ({ page }) => {
  await page.goto('/admin/professionals')

  await expect(page).not.toHaveURL(/\/admin/)
  await expect(page.getByRole('heading', { level: 1, name: 'Profissionais' })).toHaveCount(0)
})

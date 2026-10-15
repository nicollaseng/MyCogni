import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import { z } from 'zod'
import { apiUrl, sendRegistrationDocument } from './support/api'
import { signedOut } from './support/session'
import { createUser, localSupabase, makeAdmin, supabaseUrl, uniqueEmail } from './support/supabase'

const password = 'equipe-e2e-2026'

const sessionSchema = z.object({ access_token: z.string() })

async function signIn(page: Page, email: string) {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).not.toHaveURL('/sign-in')
}

async function pendingProfessional(fullName: string, registration: string): Promise<void> {
  const email = uniqueEmail('pending-pro')
  await createUser(email, password)
  const session = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: localSupabase().PUBLISHABLE_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const response = await fetch(`${apiUrl}/v1/professional`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${sessionSchema.parse(await session.json()).access_token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ kind: 'psychologist', fullName, registration }),
  })
  if (!response.ok) {
    throw new Error(`Could not register ${fullName}: ${String(response.status)}`)
  }
  await sendRegistrationDocument(email, password)
}

test.describe('as the MyCogniAI team', () => {
  test.use({ storageState: signedOut })

  test('approves a professional who is waiting for verification', async ({ page }) => {
    const fullName = `Helena Prado ${randomUUID().slice(0, 6)}`
    await pendingProfessional(fullName, 'CRP 06/112233')
    const adminEmail = uniqueEmail('admin')
    await makeAdmin(await createUser(adminEmail, password))

    await signIn(page, adminEmail)
    await page.goto('/admin/professionals')

    await expect(page.getByRole('heading', { level: 1, name: 'Profissionais' })).toBeVisible()
    const pending = page.getByRole('row', { name: fullName })
    await expect(pending).toContainText('Psicologia')
    await expect(pending).toContainText('CRP 06/112233')
    await pending.getByRole('button', { name: 'Aprovar' }).click()

    await expect(page.getByRole('status')).toHaveText(`Cadastro de ${fullName} aprovado.`)
    await expect(pending).toHaveCount(0)

    await page.getByRole('link', { name: 'Verificados' }).click()
    await expect(page).toHaveURL('/admin/professionals?status=verified')
    const verified = page.getByRole('row', { name: fullName })
    await expect(verified.getByRole('button', { name: 'Recusar' })).toBeVisible()
    await expect(verified.getByRole('button', { name: 'Aprovar' })).toHaveCount(0)
  })
})

test('keeps the review page away from people outside the team', async ({ page }) => {
  await page.goto('/admin/professionals')

  await expect(page.getByRole('heading', { name: 'Esta página não existe.' })).toBeVisible()
})

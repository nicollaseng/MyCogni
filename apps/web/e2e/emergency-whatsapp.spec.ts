import { expect, test, type Page } from '@playwright/test'
import {
  acceptInvitation,
  finishOnboarding,
  inviteByLink,
  verifiedProfessional,
} from './support/api'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'whatsapp-e2e-2026'

const message =
  'Oi Helena Prado, isso é urgente. Estou precisando de ajuda agora.\n\nMensagem enviada através do app MyCogniAI'

const href = `https://wa.me/5511987654321?text=${encodeURIComponent(message)}`

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/sign-in/)
}

test('a professional shares an emergency WhatsApp that a linked patient sees in a crisis', async ({
  page,
}) => {
  const professionalEmail = uniqueEmail('pro-whatsapp')
  await verifiedProfessional(professionalEmail, password, 'Helena Prado')
  const patientEmail = uniqueEmail('paciente-whatsapp')
  await createUser(patientEmail, password)
  await finishOnboarding(patientEmail, password)
  const { code } = await inviteByLink(professionalEmail, password)
  await acceptInvitation(patientEmail, password, code)

  await signIn(page, professionalEmail)
  await page.goto('/pro/settings')
  await page.getByRole('button', { name: 'Alterar whatsapp para emergências' }).click()
  await expect(page.getByLabel('Código do país')).toHaveValue('+55')
  await page.getByLabel('Número').fill('11 98765-4321')
  await page.getByRole('button', { name: 'Salvar número' }).click()
  await expect(page.getByText('+5511987654321')).toBeVisible()
  await page.context().clearCookies()

  await signIn(page, patientEmail)
  await page.getByRole('button', { name: 'Precisa de ajuda agora?' }).click()
  await expect(page.getByRole('link', { name: /Fale com Helena Prado agora/ })).toHaveAttribute(
    'href',
    href,
  )

  await page.goto('/check-in')
  await page.getByRole('slider', { name: 'Como você está agora?' }).fill('0')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Pular' }).click()
  await page.getByRole('textbox', { name: 'Nota sobre hoje' }).fill('Vontade de morrer')
  await page.getByRole('button', { name: 'Registrar', exact: true }).click()

  const card = page.getByRole('region', { name: 'Apoio agora' })
  await expect(card.getByRole('link', { name: '188 CVV' })).toHaveAttribute('href', 'tel:188')
  const whatsapp = card.getByRole('link', { name: /Fale com Helena Prado agora/ })
  await expect(whatsapp).toHaveAttribute('href', href)
  await expect(whatsapp).toHaveAttribute('target', '_blank')
  await expect(whatsapp).toHaveAttribute('rel', 'noopener noreferrer')
})

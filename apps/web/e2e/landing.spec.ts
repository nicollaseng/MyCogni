import { expect, test } from '@playwright/test'
import { signedOut } from './support/session'

test.use({ storageState: signedOut })

test('invites the visitor to try the scale and create an account', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Como você está agora?')
  await expect(page.getByRole('slider', { name: 'Como você está agora?' })).toBeVisible()

  await page.getByRole('main').getByRole('link', { name: 'Começar' }).first().click()

  await expect(page).toHaveURL('/sign-up')
  await expect(page.getByRole('heading', { level: 1, name: 'Criar conta' })).toBeVisible()
})

test('jumps to a section from the header on desktop', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the section links live in the desktop header')
  await page.goto('/')

  await page
    .getByRole('navigation', { name: 'Seções' })
    .getByRole('link', { name: 'Inteligência artificial' })
    .click()

  await expect(page).toHaveURL('/#ia')
  await expect(
    page.getByRole('heading', { level: 2, name: 'A IA escreve. Os números vêm de você.' }),
  ).toBeInViewport()
})

test('opens an answer in the questions', async ({ page }) => {
  await page.goto('/')

  await page.getByText('Meus dados são vendidos ou usados para treinar IA?').click()

  await expect(page.getByText('Não. Seus registros não são vendidos')).toBeVisible()
})

test('reaches the privacy policy from the footer', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('contentinfo').getByRole('link', { name: 'Política de privacidade' }).click()

  await expect(page).toHaveURL('/privacy')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Política de privacidade' }),
  ).toBeVisible()
})

test('reaches the terms of use from the footer', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('contentinfo').getByRole('link', { name: 'Termos de uso' }).click()

  await expect(page).toHaveURL('/terms')
  await expect(page.getByText(/ligue para o CVV no 188/)).toBeVisible()
})

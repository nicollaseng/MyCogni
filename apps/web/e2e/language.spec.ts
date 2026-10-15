import { expect, test } from '@playwright/test'
import { signedOut } from './support/session'

test.use({ storageState: signedOut })

test.describe('language of a first visit', () => {
  test.use({ locale: 'en-US' })

  test('follows the language of the browser', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'How are you feeling right now?',
    )
  })

  test('prefers the country of the connection over the browser', async ({ page }) => {
    await page.setExtraHTTPHeaders({ 'x-forwarded-for': '193.136.66.1' })
    await page.goto('/')

    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-PT')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Como se sente agora?')
  })
})

test('keeps the language the visitor picks in the header', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')

  await page.getByRole('combobox', { name: 'Idioma' }).selectOption('en-GB')

  await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How are you feeling right now?')

  await page.goto('/sign-in')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB')
  await expect(page.getByRole('link', { name: 'Forgotten your password?' })).toBeVisible()
})

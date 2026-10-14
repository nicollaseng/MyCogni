import { expect, test, type Locator, type Page } from '@playwright/test'

function mainNavigation(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Navegação principal' })
}

async function boxOf(locator: Locator): Promise<{ x: number; y: number; height: number }> {
  const box = await locator.boundingBox()
  if (box === null) {
    throw new Error('Element is not rendered')
  }
  return box
}

test('starts on the landing page and enters the app', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Como você está agora?')
  await expect(page.getByRole('slider', { name: 'Como você está agora?' })).toBeVisible()

  await page.getByRole('link', { name: 'Começar' }).click()

  await expect(page).toHaveURL('/today')
  await expect(page.getByRole('heading', { level: 1, name: 'Como você está agora?' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Registrar como estou' })).toHaveAttribute(
    'href',
    '/check-in',
  )
})

test('moves between sections through the main navigation', async ({ page }) => {
  await page.goto('/today')

  await mainNavigation(page).getByRole('link', { name: 'Padrões' }).click()

  await expect(page).toHaveURL('/patterns')
  await expect(page.getByRole('heading', { level: 1, name: 'Padrões' })).toBeVisible()
  await expect(mainNavigation(page).getByRole('link', { name: 'Padrões' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('keeps the navigation at the bottom of the screen on mobile', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile layout')
  await page.goto('/today')

  const box = await boxOf(mainNavigation(page))
  const viewportHeight = page.viewportSize()?.height ?? 0

  expect(Math.round(box.y + box.height)).toBe(viewportHeight)
})

test('keeps the navigation in the header on desktop', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop layout')
  await page.goto('/today')

  const box = await boxOf(mainNavigation(page))

  expect(box.y).toBeLessThan(80)
})

test('opens crisis help from any screen of the app', async ({ page }) => {
  await page.goto('/entries')

  await page.getByText('Precisa de ajuda agora?').click()

  await expect(page.getByRole('link', { name: '188' })).toBeVisible()
  await expect(page.getByRole('link', { name: '188' })).toHaveAttribute('href', 'tel:188')
})

test('answers unknown addresses with a friendly page', async ({ page }) => {
  const response = await page.goto('/does-not-exist')

  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Esta página não existe.' })).toBeVisible()
})

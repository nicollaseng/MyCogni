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

test('opens on today with the way into the check-in', async ({ page }) => {
  await page.goto('/today')

  await expect(page.getByRole('heading', { level: 1, name: 'Como você está agora?' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Registrar como estou' })).toHaveAttribute(
    'href',
    '/check-in',
  )
  await expect(page.getByText('Prefere escrever?')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Abrir o MyBook' })).toHaveAttribute(
    'href',
    '/mybook',
  )
})

test('keeps five sections in the navigation and the account in the header', async ({ page }) => {
  await page.goto('/today')

  await expect(mainNavigation(page).getByRole('link')).toHaveText([
    'Hoje',
    'Registros',
    'Zen',
    'MyBook',
    'Padrões',
  ])
  await expect(page.getByRole('link', { name: 'Você', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Sua conta' })).toBeVisible()
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

test('highlights Zen in the middle of the navigation and marks it when open', async ({ page }) => {
  await page.goto('/today')
  const zen = mainNavigation(page).getByRole('link', { name: 'Zen' })

  await expect(zen).toHaveAttribute('data-zen-tab')
  await expect(zen.locator('svg[data-icon="lotus"]')).toBeVisible()
  await expect(zen).not.toHaveAttribute('aria-current')
  const brand = page.getByRole('banner').getByRole('link', { name: 'MyCogniAI' })
  await expect(brand.getByTestId('brand-mark')).toBeVisible()
  const zenBox = await zen.boundingBox()
  const navigationBox = await mainNavigation(page).getByRole('list').boundingBox()
  if (zenBox === null || navigationBox === null) {
    throw new Error('The navigation is not rendered')
  }
  const offset = zenBox.x + zenBox.width / 2 - (navigationBox.x + navigationBox.width / 2)
  expect(Math.abs(offset)).toBeLessThan(navigationBox.width * 0.15)

  await zen.click()

  await expect(page).toHaveURL('/zen')
  await expect(zen).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('heading', { level: 1, name: 'Zen Space' })).toBeVisible()
  await expect(brand.getByTestId('brand-mark')).toBeVisible()
})

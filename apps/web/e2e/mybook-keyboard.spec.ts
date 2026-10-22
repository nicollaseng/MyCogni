import { expect, test, type Locator, type Page } from '@playwright/test'
import {
  formatBar,
  keyboardHeight,
  keyboardTop,
  simulateKeyboard,
  tabBar,
} from './support/keyboard'
import { pageBody, startPage, unique } from './support/mybook'

async function box(locator: Locator) {
  const found = await locator.boundingBox()
  if (found === null) {
    throw new Error('The element is not rendered')
  }
  return found
}

function caretBottom(page: Page): Promise<number> {
  return page.evaluate(() => {
    const node = window.getSelection()?.focusNode
    const element = node instanceof Element ? node : node?.parentElement
    if (!element) {
      throw new Error('No caret')
    }
    return element.getBoundingClientRect().bottom
  })
}

test.beforeEach(async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Only phones open an on-screen keyboard')
  await simulateKeyboard(page)
})

test('puts the format bar on the keyboard and hides the tab bar while writing', async ({
  page,
}) => {
  await startPage(page, unique('Teclado'), 'Escrevendo com o teclado aberto.')

  const bar = formatBar(page)
  await expect(bar).toHaveAttribute('data-placement', 'writing')
  await expect(tabBar(page)).toBeHidden()
  const onKeyboard = await box(bar)
  expect(onKeyboard.y + onKeyboard.height).toBeCloseTo(await keyboardTop(page), 0)

  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  })

  await expect(bar).toHaveAttribute('data-placement', 'reading')
  await expect(tabBar(page)).toBeVisible()
  const resting = await box(bar)
  const tabs = await box(tabBar(page))
  expect(Math.abs(resting.y + resting.height - tabs.y)).toBeLessThanOrEqual(1)
})

test('shows only the formatting panel in place of the keyboard and returns to the same text', async ({
  page,
}) => {
  await startPage(page, unique('Formatar'), 'Hoje foi bom')
  await page.keyboard.press('Home')
  for (let step = 0; step < 4; step += 1) {
    await page.keyboard.press('Shift+ArrowRight')
  }

  await page.getByRole('button', { name: 'Formatar texto' }).click()

  const panel = page.getByRole('group', { name: 'Formatar' })
  await expect(panel).toBeVisible()
  await expect(formatBar(page)).toHaveCount(0)
  await expect(tabBar(page)).toBeHidden()
  await expect(pageBody(page)).not.toBeFocused()
  const sheet = await box(panel)
  expect(sheet.height).toBeGreaterThanOrEqual(keyboardHeight - 1)
  expect(sheet.y + sheet.height).toBeCloseTo(await page.evaluate(() => window.innerHeight), 0)

  await panel.getByRole('button', { name: 'Negrito' }).click()

  await expect(pageBody(page).locator('strong')).toHaveText('Hoje')
  await expect(pageBody(page)).not.toBeFocused()

  await panel.getByRole('button', { name: 'Fechar formatação' }).click()

  await expect(panel).toHaveCount(0)
  await expect(pageBody(page)).toBeFocused()
  await expect(formatBar(page)).toHaveAttribute('data-placement', 'writing')
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe('Hoje')
})

test('keeps the line being typed above the format bar on a long page', async ({ page }) => {
  await startPage(page, unique('Página longa'), 'Começo do dia.')

  for (let line = 1; line <= 40; line += 1) {
    await page.keyboard.press('Enter')
    await page.keyboard.type(`Linha ${String(line)}`)
    if (line % 10 === 0) {
      const bar = await box(formatBar(page))
      expect(await caretBottom(page)).toBeLessThanOrEqual(bar.y)
    }
  }

  await expect(pageBody(page).getByText('Linha 40', { exact: true })).toBeInViewport()
  const bar = await box(formatBar(page))
  const last = await box(pageBody(page).getByText('Linha 40', { exact: true }))
  expect(last.y + last.height).toBeLessThanOrEqual(bar.y)
  expect(last.y).toBeGreaterThanOrEqual(0)
})

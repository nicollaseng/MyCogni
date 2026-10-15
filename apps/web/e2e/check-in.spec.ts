import { expect, test, type Locator, type Page } from '@playwright/test'

function moodSlider(page: Page): Locator {
  return page.getByRole('slider', { name: 'Como você está agora?' })
}

async function fitsWithoutScrolling(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const root = document.scrollingElement
    return root !== null && root.scrollHeight <= window.innerHeight + 1
  })
}

test('opens the check-in from the today screen', async ({ page }) => {
  await page.goto('/today')

  await page.getByRole('link', { name: 'Registrar como estou' }).click()

  await expect(page).toHaveURL('/check-in')
  await expect(moodSlider(page)).toHaveAttribute('aria-valuetext', 'Neutro')
})

test('answers the mood with the keyboard', async ({ page }) => {
  await page.goto('/check-in')

  await moodSlider(page).focus()
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')

  await expect(moodSlider(page)).toHaveAttribute('aria-valuetext', 'Mal')
})

test('records mood, emotions from different groups and context', async ({ page }) => {
  await page.goto('/check-in')

  await moodSlider(page).fill('1')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'ansiedade', exact: true }).click()
  await page.getByRole('tab', { name: 'tristeza' }).click()
  await page.getByRole('button', { name: 'solidão' }).click()
  await page.getByRole('button', { name: 'Continuar com 2' }).click()
  await page.getByRole('button', { name: 'sono' }).click()
  await page.getByRole('button', { name: 'Registrar', exact: true }).click()

  await expect(page.getByRole('heading', { name: /^Registrado às \d{2}:\d{2}\.$/ })).toBeVisible()
  await expect(page.getByText('mal · ansiedade · solidão · sono')).toBeVisible()
})

test('records only the mood in one tap', async ({ page }) => {
  await page.goto('/check-in')

  await moodSlider(page).fill('0')
  await page.getByRole('button', { name: 'Registrar só o humor' }).click()

  await expect(page.getByText('muito mal', { exact: true })).toBeVisible()
})

test('keeps the record and shows it in Registros and on Hoje', async ({ page }) => {
  const note = `Caminhei no fim da tarde ${String(Date.now())}`
  await page.goto('/check-in')

  await moodSlider(page).fill('5')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Pular' }).click()
  await page.getByRole('textbox', { name: 'Nota sobre hoje' }).fill(note)
  await page.getByRole('button', { name: 'Registrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: /^Registrado às \d{2}:\d{2}\.$/ })).toBeVisible()

  await page.getByRole('link', { name: 'Ver registros' }).click()
  await expect(page).toHaveURL('/entries')
  const today = page.getByRole('region', { name: 'Hoje' })
  await expect(today.getByText(note)).toBeVisible()
  await expect(today.getByRole('listitem').filter({ hasText: note })).toContainText('Bem')

  await page.goto('/today')
  await expect(page.getByText(/de 14 dias com registro\./)).toBeVisible()
})

test.describe('on a small phone', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('never asks the person to scroll', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone layout')
    await page.goto('/check-in')
    expect(await fitsWithoutScrolling(page)).toBe(true)

    await page.getByRole('button', { name: 'Continuar' }).click()
    expect(await fitsWithoutScrolling(page)).toBe(true)

    await page.getByRole('button', { name: 'Pular' }).click()
    expect(await fitsWithoutScrolling(page)).toBe(true)
  })
})

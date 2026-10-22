import { expect, test, type Locator, type Page } from '@playwright/test'
import { finishOnboarding } from './support/api'
import { seedCheckIns, seedJournalPages } from './support/database'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'paginas-e2e-2026'

function numbered(prefix: string, index: number): string {
  return `${prefix} ${String(index + 1).padStart(2, '0')}`
}

async function signInWith(page: Page, seed: (userId: string) => Promise<void>): Promise<void> {
  const email = uniqueEmail('paginas')
  const userId = await createUser(email, password)
  await finishOnboarding(email, password)
  await seed(userId)
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/today')
}

function pagerOf(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Paginação' })
}

async function fitsNarrowPhone(page: Page, path: string): Promise<void> {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(path)
  await pagerOf(page).scrollIntoViewIfNeeded()
  await expect(pagerOf(page)).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
}

test('MyBook shows ten pages at a time and keeps the page and the size in the address', async ({
  page,
}) => {
  await signInWith(page, (userId) =>
    seedJournalPages(
      userId,
      Array.from({ length: 37 }, (_, index) => numbered('Diário', index)),
    ),
  )
  const pager = pagerOf(page)
  const pages = page.getByRole('main').getByRole('link', { name: /^Diário \d{2}/ })

  await page.goto('/mybook')
  await expect(pager.getByText('1–10 de 37')).toBeVisible()
  await expect(pages).toHaveCount(10)
  await expect(pages.first()).toContainText('Diário 01')
  await expect(pager.getByRole('link', { name: 'Página anterior' })).toHaveAttribute(
    'aria-disabled',
    'true',
  )

  await pager.getByRole('link', { name: 'Próxima página' }).click()
  await expect(page).toHaveURL('/mybook?page=2')
  await expect(pager.getByText('11–20 de 37')).toBeVisible()
  await expect(pages.first()).toContainText('Diário 11')

  await page.goBack()
  await expect(page).toHaveURL('/mybook')
  await expect(pager.getByText('1–10 de 37')).toBeVisible()
  await page.goForward()
  await expect(page).toHaveURL('/mybook?page=2')
  await expect(pager.getByText('11–20 de 37')).toBeVisible()

  await pager.getByRole('combobox', { name: 'Por página' }).selectOption('25')
  await expect(page).toHaveURL('/mybook?size=25')
  await expect(pager.getByText('1–25 de 37')).toBeVisible()
  await expect(pages).toHaveCount(25)

  await pager.getByRole('link', { name: 'Próxima página' }).click()
  await expect(page).toHaveURL('/mybook?page=2&size=25')
  await expect(pager.getByText('26–37 de 37')).toBeVisible()
  await expect(pages).toHaveCount(12)
  await expect(pager.getByRole('link', { name: 'Próxima página' })).toHaveAttribute(
    'aria-disabled',
    'true',
  )

  await pager.getByRole('link', { name: 'Página anterior' }).click()
  await expect(page).toHaveURL('/mybook?size=25')
  await expect(pages.first()).toContainText('Diário 01')

  await page.goto('/mybook?page=2&size=25')
  await page.getByRole('searchbox', { name: 'Buscar no MyBook' }).fill('Diário 3')
  await expect(page).toHaveURL('/mybook?q=Di%C3%A1rio+3&size=25')
  await expect(pager.getByText('1–8 de 8')).toBeVisible()
  await expect(pages).toHaveCount(8)
  await expect(pages.first()).toContainText('Diário 30')

  await page.goto('/mybook?page=99&size=7')
  await expect(pager.getByText('31–37 de 37')).toBeVisible()
  await expect(pager.getByRole('combobox', { name: 'Por página' })).toHaveValue('10')
  await expect(pages).toHaveCount(7)

  await fitsNarrowPhone(page, '/mybook?page=2&size=25')
})

test('Registros pages the records together with the search and the filters', async ({ page }) => {
  await signInWith(page, (userId) =>
    seedCheckIns(
      userId,
      Array.from({ length: 37 }, (_, index) => ({
        moodLevel: index % 2 === 0 ? 5 : 2,
        emotions: index % 3 === 0 ? ['anxiety'] : ['calm'],
        contexts: ['work'],
        note: numbered('Nota', index),
      })),
    ),
  )
  const pager = pagerOf(page)
  const records = page.getByRole('main').getByRole('link', { name: /Nota \d{2}/ })

  await page.goto('/entries')
  await expect(page.getByRole('status')).toHaveText('37 registros')
  await expect(pager.getByText('1–10 de 37')).toBeVisible()
  await expect(records).toHaveCount(10)
  await expect(records.first()).toContainText('Nota 01')

  await pager.getByRole('link', { name: 'Próxima página' }).click()
  await expect(page).toHaveURL('/entries?page=2')
  await expect(pager.getByText('11–20 de 37')).toBeVisible()
  await expect(records.first()).toContainText('Nota 11')

  await pager.getByRole('combobox', { name: 'Por página' }).selectOption('25')
  await expect(page).toHaveURL('/entries?size=25')
  await expect(pager.getByText('1–25 de 37')).toBeVisible()
  await expect(records).toHaveCount(25)

  await pager.getByRole('link', { name: 'Próxima página' }).click()
  await expect(page).toHaveURL('/entries?page=2&size=25')
  await expect(pager.getByText('26–37 de 37')).toBeVisible()
  await expect(records).toHaveCount(12)

  await pager.getByRole('link', { name: 'Página anterior' }).click()
  await expect(page).toHaveURL('/entries?size=25')
  await expect(records.first()).toContainText('Nota 01')

  await page.goto('/entries?emotion=anxiety&page=2')
  await expect(page.getByRole('status')).toHaveText('13 registros encontrados')
  await expect(pager.getByText('11–13 de 13')).toBeVisible()
  await expect(records).toHaveText([/Nota 31/, /Nota 34/, /Nota 37/])

  await page.goto('/entries?mood=4-6&page=2&size=25')
  const search = page.getByRole('searchbox', { name: 'Buscar nos registros' })
  await search.fill('nota 1')
  await search.press('Enter')
  await expect(page).toHaveURL('/entries?q=nota+1&mood=4-6&size=25')
  await expect(page.getByRole('status')).toHaveText('5 registros encontrados')
  await expect(pager.getByText('1–5 de 5')).toBeVisible()

  await page.goto('/entries?page=2')
  await records.first().click()
  await expect(page).toHaveURL(/\/entries\/[0-9a-f-]{36}\?page=2$/)
  await page.getByRole('main').getByRole('link', { name: 'Registros', exact: true }).click()
  await expect(page).toHaveURL('/entries?page=2')
  await expect(pager.getByText('11–20 de 37')).toBeVisible()

  await fitsNarrowPhone(page, '/entries?page=2&size=25')
})

import { expect, test, type Locator, type Page } from '@playwright/test'
import { finishOnboarding } from './support/api'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'zen-space-2026'

async function signInAsReadyPerson(page: Page): Promise<void> {
  const email = uniqueEmail('zen')
  await createUser(email, password)
  await finishOnboarding(email, password)
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/today')
}

function mainNavigation(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Navegação principal' })
}

function forYou(page: Page): Locator {
  return page.getByRole('region', { name: 'Para você agora' })
}

function step(page: Page, name: string): Locator {
  return page.getByRole('listitem', { name })
}

test('opens Zen from the tab, follows the suggested track, reads an article and completes a step', async ({
  page,
}) => {
  await signInAsReadyPerson(page)

  await mainNavigation(page).getByRole('link', { name: 'Zen' }).click()

  await expect(page).toHaveURL('/zen')
  await expect(page.getByRole('heading', { level: 1, name: 'Zen Space' })).toBeVisible()
  await expect(mainNavigation(page).getByRole('link', { name: 'Zen' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(forYou(page).getByRole('heading', { name: 'Sono e descanso' })).toBeVisible()

  await forYou(page).getByRole('link', { name: 'Começar a trilha' }).click()
  await expect(page).toHaveURL('/zen/tracks/sleep-and-rest')
  await expect(page.getByText('0 de 5 passos feitos')).toBeVisible()

  await step(page, 'Ler: sono e humor').getByRole('link', { name: 'Ler' }).click()
  await expect(page).toHaveURL('/zen/articles/sleep-and-mood')
  await expect(page.getByRole('heading', { level: 1, name: 'Sono e humor' })).toBeVisible()
  await expect(
    page.getByText('Conteúdo educativo, não substitui acompanhamento profissional.'),
  ).toBeVisible()
  const references = page.getByRole('region', { name: 'Referências' })
  await expect(references.getByRole('listitem')).toHaveCount(6)
  await expect(references.getByRole('link', { name: 'nhs.uk' })).toHaveAttribute(
    'href',
    'https://www.nhs.uk/conditions/insomnia/',
  )

  await page.getByRole('link', { name: 'Sono e descanso' }).click()
  await expect(page).toHaveURL('/zen/tracks/sleep-and-rest')
  const reading = step(page, 'Ler: sono e humor')
  await reading.getByRole('button', { name: 'Marcar como feito' }).click()
  await expect(reading.getByRole('button', { name: 'Feito' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByText('1 de 5 passos feitos')).toBeVisible()

  await page.reload()
  await expect(step(page, 'Ler: sono e humor').getByRole('button', { name: 'Feito' })).toBeVisible()

  await page.getByRole('link', { name: 'Zen Space' }).click()
  await expect(forYou(page)).toContainText('1 de 5 passos')
  await expect(forYou(page).getByRole('link', { name: 'Continuar a trilha' })).toBeVisible()
  await expect(
    page.getByRole('region', { name: 'Trilhas' }).getByRole('link', { name: /Sono e descanso/ }),
  ).toContainText('1 de 5 passos')
})

test('guides the breathing exercise and opens a MyBook page from a prompt', async ({ page }) => {
  await signInAsReadyPerson(page)
  await page.goto('/zen/tracks/sleep-and-rest')

  await step(page, 'Respirar antes de deitar')
    .getByRole('button', { name: 'Começar o exercício' })
    .click()
  const sheet = page.getByRole('dialog', { name: 'Respirar em quadrado' })
  await sheet.getByRole('button', { name: 'Começar' }).click()
  await expect(sheet.getByRole('status')).toHaveText('Inspire')
  await expect(sheet.getByRole('status')).toHaveText('Segure', { timeout: 6000 })
  await sheet.getByRole('button', { name: 'Pausar' }).click()
  await page.keyboard.press('Escape')
  await expect(sheet).toHaveCount(0)

  await step(page, 'Escrever no MyBook').getByRole('button', { name: 'Escrever no MyBook' }).click()

  await expect(page).toHaveURL(/\/mybook\/[0-9a-f-]{36}$/)
  await expect(page.getByRole('textbox', { name: 'Texto da página' })).toContainText(
    'Como foram suas últimas três noites?',
  )
})

test('answers the questionnaires again and sees the suggestion change', async ({ page }) => {
  await signInAsReadyPerson(page)
  await page.goto('/zen')
  await expect(forYou(page).getByRole('heading', { name: 'Sono e descanso' })).toBeVisible()

  await page.getByRole('link', { name: 'Refazer os questionários' }).click()
  await expect(page).toHaveURL('/questionnaires')
  await page.getByRole('button', { name: 'Começar' }).click()
  for (const [form, total, choice] of [
    ['PHQ-9', 9, 'Nenhuma vez'],
    ['GAD-7', 7, 'Mais da metade dos dias'],
  ] as const) {
    for (let index = 1; index <= total; index++) {
      await expect(page.getByText(`${form} · ${String(index)} de ${String(total)}`)).toBeVisible()
      await page.getByRole('button', { name: choice, exact: true }).click()
    }
  }
  await expect(page.getByRole('heading', { name: 'Seus resultados de hoje.' })).toBeVisible()

  await page.getByRole('link', { name: 'Ver sugestões no Zen Space' }).click()
  await expect(page).toHaveURL('/zen')

  await expect(forYou(page).getByRole('heading', { name: 'Ansiedade no dia a dia' })).toBeVisible()
  await expect(
    forYou(page).getByRole('link', { name: 'O que é ansiedade, e o que não é' }),
  ).toBeVisible()
  await forYou(page).getByRole('button', { name: 'Por que estas sugestões?' }).click()
  await expect(
    forYou(page).getByText('O seu GAD-7 mais recente ficou na faixa moderada ou acima.'),
  ).toBeVisible()
})

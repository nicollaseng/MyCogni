import { expect, test, type Locator, type Page } from '@playwright/test'
import { answerQuestionnaires, finishOnboarding } from './support/api'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'zen-space-2026'

interface Answers {
  phq9: number[]
  gad7: number[]
}

const riskAnswer: Answers = { phq9: [1, 1, 1, 1, 0, 0, 1, 0, 1], gad7: [1, 1, 1, 1, 1, 1, 1] }

const severeAnswers: Answers = { phq9: [3, 3, 3, 3, 3, 3, 3, 3, 0], gad7: [3, 3, 3, 3, 3, 3, 3] }

async function signInAsReadyPerson(page: Page, answers: Answers | null = null): Promise<void> {
  const email = uniqueEmail('zen')
  await createUser(email, password)
  await finishOnboarding(email, password)
  if (answers !== null) {
    await answerQuestionnaires(email, password, answers.phq9, answers.gad7)
  }
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/today')
}

function mainNavigation(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Navegação principal' })
}

function today(page: Page): Locator {
  return page.getByRole('region', { name: 'Para hoje' })
}

function step(page: Page, name: string): Locator {
  return page.getByRole('listitem', { name })
}

async function openStep(page: Page, name: string): Promise<Locator> {
  const row = step(page, name)
  await row.getByRole('button', { name: new RegExp(name) }).click()
  return row
}

test('opens Zen from the tab, starts the step for today, listens to it and completes it', async ({
  page,
}) => {
  await signInAsReadyPerson(page)

  await mainNavigation(page).getByRole('link', { name: 'Zen' }).click()

  await expect(page).toHaveURL('/zen')
  await expect(page.getByRole('heading', { level: 1, name: 'Zen Space' })).toBeVisible()
  await expect(today(page).getByRole('heading', { name: 'Sono e humor' })).toBeVisible()
  await expect(today(page)).toContainText('Sono e descanso · passo 1 de 5')

  await today(page).getByRole('link', { name: 'Começar' }).click()
  await expect(page).toHaveURL('/zen/articles/sleep-and-mood')
  await expect(page.getByRole('heading', { level: 1, name: 'Sono e humor' })).toBeVisible()

  const listen = page.getByRole('button', { name: 'Ouvir: Sono e humor' })
  await expect(async () => {
    await page.reload()
    await expect(listen).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 90_000 })
  await listen.click()
  const player = page.getByRole('group', { name: 'Leitura em voz alta' })
  await expect(player.getByRole('button', { name: 'Avançar 15 segundos' })).toBeVisible()
  await expect(player.getByRole('button', { name: 'Velocidade: 1×' })).toBeVisible()
  await player.getByRole('button', { name: 'Velocidade: 1×' }).click()
  await expect(player.getByRole('button', { name: 'Velocidade: 1,1×' })).toBeVisible()

  await expect(page.getByRole('list', { name: 'Fontes' })).toBeHidden()
  await page.getByRole('button', { name: 'Fontes' }).click()
  await expect(page.getByRole('list', { name: 'Fontes' }).getByRole('listitem')).toHaveCount(6)

  await page.getByRole('link', { name: 'Sono e descanso' }).click()
  await expect(page).toHaveURL('/zen/tracks/sleep-and-rest')
  await expect(page.getByText('0 de 5 passos feitos')).toBeVisible()
  const reading = await openStep(page, 'Ler: sono e humor')
  await reading.getByRole('button', { name: 'Marcar como feito' }).click()
  await expect(reading.getByRole('button', { name: 'Feito' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByText('1 de 5 passos feitos')).toBeVisible()

  await page.reload()
  await expect(step(page, 'Ler: sono e humor')).toContainText('Feito')

  await page.getByRole('link', { name: 'Zen Space' }).click()
  await expect(today(page).getByRole('heading', { name: 'Escrever no MyBook' })).toBeVisible()
  await expect(today(page).getByRole('button', { name: 'Continuar' })).toBeVisible()
  await expect(
    page.getByRole('region', { name: 'Trilhas' }).getByRole('link', { name: /Sono e descanso/ }),
  ).toContainText('1 de 5')
})

test('breathes for a minute and opens a MyBook page from a prompt', async ({ page }) => {
  await signInAsReadyPerson(page)
  await page.goto('/zen')

  await page.getByRole('button', { name: 'Respirar 1 min' }).click()
  const sheet = page.getByRole('dialog', { name: 'Respirar em quadrado' })
  await sheet.getByRole('button', { name: 'Começar' }).click()
  await expect(sheet.getByRole('status')).toHaveText('Inspire')
  await expect(sheet.getByRole('status')).toHaveText('Segure', { timeout: 6000 })
  await sheet.getByRole('button', { name: 'Pausar' }).click()
  await page.keyboard.press('Escape')
  await expect(sheet).toHaveCount(0)

  await page.getByRole('link', { name: 'Sono', exact: true }).click()
  await expect(page).toHaveURL('/zen/topics/sleep')
  await page.getByRole('link', { name: /Sono e descanso/ }).click()
  const writing = await openStep(page, 'Escrever no MyBook')
  await writing.getByRole('button', { name: 'Escrever no MyBook', exact: true }).click()

  await expect(page).toHaveURL(/\/mybook\/[0-9a-f-]{36}$/)
  await expect(page.getByRole('textbox', { name: 'Texto da página' })).toContainText(
    'Como foram suas últimas três noites?',
  )
})

test('answers the questionnaires again and sees the suggestion change', async ({ page }) => {
  await signInAsReadyPerson(page)
  await page.goto('/zen')
  await expect(today(page).getByRole('heading', { name: 'Sono e humor' })).toBeVisible()

  await today(page).getByRole('button', { name: 'Por que esta sugestão?' }).click()
  await today(page).getByRole('link', { name: 'Refazer os questionários' }).click()
  await expect(page).toHaveURL('/questionnaires')
  await page.getByRole('button', { name: 'Começar' }).click()
  for (const [form, total, choice] of [
    ['Desânimo', 9, 'Nenhuma vez'],
    ['Ansiedade', 7, 'Mais da metade dos dias'],
  ] as const) {
    for (let index = 1; index <= total; index++) {
      await expect(page.getByText(`${form} · ${String(index)} de ${String(total)}`)).toBeVisible()
      await page.getByRole('button', { name: choice, exact: true }).click()
    }
  }
  await expect(page.getByRole('heading', { name: 'Seus resultados de hoje.' })).toBeVisible()

  await page.getByRole('link', { name: 'Ver sugestões no Zen Space' }).click()
  await expect(page).toHaveURL('/zen')

  await expect(
    today(page).getByRole('heading', { name: 'O que é ansiedade, e o que não é' }),
  ).toBeVisible()
  await today(page).getByRole('button', { name: 'Por que esta sugestão?' }).click()
  await expect(
    today(page).getByText('Sua última resposta sobre ansiedade ficou em moderado ou acima.'),
  ).toBeVisible()
})

test('offers crisis help after a risk answer and keeps the footer help on Zen', async ({
  page,
}) => {
  await signInAsReadyPerson(page, riskAnswer)
  await page.goto('/zen')

  const panel = page.getByRole('region', { name: 'Apoio agora' })
  await expect(panel).toContainText('Você não precisa passar por isso sem apoio')
  await expect(panel.getByRole('link', { name: '188 CVV' })).toHaveAttribute('href', 'tel:188')
  await expect(today(page).getByRole('heading', { name: 'Quando buscar ajuda' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ajuda agora', exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: 'Precisa de ajuda agora?' }).click()
  await expect(page.getByRole('link', { name: '192', exact: true })).toHaveAttribute(
    'href',
    'tel:192',
  )
})

test('keeps Zen calm after severe results without a risk answer', async ({ page }) => {
  await signInAsReadyPerson(page, severeAnswers)
  await page.goto('/zen')

  await expect(today(page).getByRole('heading', { name: 'Quando buscar ajuda' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Apoio agora' })).toHaveCount(0)
  await page.getByRole('link', { name: 'Ansiedade', exact: true }).click()
  await expect(page).toHaveURL('/zen/topics/anxiety')
  await expect(page.getByRole('button', { name: 'Ajuda agora', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Precisa de ajuda agora?' })).toBeVisible()
})

test('plays the background sound only after a tap and follows the sound chosen in settings', async ({
  page,
}) => {
  await signInAsReadyPerson(page)
  await expect(page.getByRole('button', { name: /Som de fundo/ })).toHaveCount(0)

  await mainNavigation(page).getByRole('link', { name: 'Zen' }).click()
  const sea = page.getByRole('button', { name: 'Som de fundo: Mar' })
  await expect(sea).toHaveAttribute('aria-pressed', 'false')
  await sea.click()
  await expect(sea).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('link', { name: 'Ansiedade', exact: true }).click()
  await expect(page).toHaveURL('/zen/topics/anxiety')
  await expect(sea).toHaveAttribute('aria-pressed', 'true')
  await sea.click()
  await expect(sea).toHaveAttribute('aria-pressed', 'false')

  await page.goto('/me')
  const settings = page.getByRole('region', { name: 'Som e voz' })
  await settings.getByLabel('Qual som').selectOption('rain')
  await settings.getByText('Em todo o app').click()
  await expect(settings.getByText('Essas escolhas ficam salvas só neste aparelho.')).toBeVisible()

  await page.goto('/today')
  await expect(page.getByRole('button', { name: 'Som de fundo: Chuva' })).toBeVisible()
  await page.goto('/zen')
  await expect(page.getByRole('button', { name: 'Som de fundo: Chuva' })).toBeVisible()

  await page.goto('/me')
  await page.getByRole('region', { name: 'Som e voz' }).getByText('Desligado').click()
  await page.goto('/zen')
  await expect(page.getByRole('heading', { level: 1, name: 'Zen Space' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Som de fundo/ })).toHaveCount(0)
})

test('chooses, previews and keeps each of the new background sounds', async ({ page }) => {
  await signInAsReadyPerson(page)
  await page.goto('/me')
  const settings = page.getByRole('region', { name: 'Som e voz' })
  const sound = settings.getByLabel('Qual som')

  for (const [id, name] of [
    ['night-forest', 'Floresta à noite'],
    ['birdsong', 'Pássaros'],
    ['meadow', 'Campo'],
    ['campfire', 'Fogueira'],
    ['mountain-wind', 'Montanha'],
    ['snow', 'Neve'],
    ['owl', 'Coruja'],
  ] as const) {
    await sound.selectOption(id)
    const preview = page.waitForResponse((response) =>
      response.url().includes(`/audio/ambient/${id}.`),
    )
    await settings.getByRole('button', { name: 'Ouvir', exact: true }).click()
    expect((await preview).status()).toBe(200)
    await expect(settings.getByRole('button', { name: 'Parar' })).toBeVisible()
    await settings.getByRole('button', { name: 'Parar' }).click()

    await page.reload()
    await expect(sound).toHaveValue(id)
    await page.goto('/zen')
    await expect(page.getByRole('button', { name: `Som de fundo: ${name}` })).toBeVisible()
    await page.goto('/me')
  }
})

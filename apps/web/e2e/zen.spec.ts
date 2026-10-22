import { expect, test, type Locator, type Page } from '@playwright/test'
import {
  answerQuestionnaires,
  finishOnboarding,
  recordCheckIns,
  setTimeZone,
  type CheckInSeed,
} from './support/api'
import { zoneAtHour } from './support/clock'
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

const daytime = 12

const night = 23

interface Person {
  hour?: number
  checkIns?: readonly CheckInSeed[]
}

async function signInAsReadyPerson(
  page: Page,
  answers: Answers | null = null,
  { hour = daytime, checkIns = [] }: Person = {},
): Promise<void> {
  const email = uniqueEmail('zen')
  await createUser(email, password)
  await finishOnboarding(email, password)
  await setTimeZone(email, password, zoneAtHour(hour))
  if (answers !== null) {
    await answerQuestionnaires(email, password, answers.phq9, answers.gad7)
  }
  if (checkIns.length > 0) {
    await recordCheckIns(email, password, checkIns)
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

function headerSound(page: Page, name: string): Locator {
  return page.getByRole('button', { name: `Som de fundo: ${name}`, exact: true })
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
  const mode = page.getByRole('dialog', { name: 'Respirar em quadrado' })
  await mode.getByRole('button', { name: 'Começar' }).click()
  await expect(mode.getByRole('status')).toHaveText('Inspire')
  await expect(mode.getByRole('status')).toHaveText('Segure', { timeout: 6000 })
  await mode.getByRole('button', { name: 'Pausar' }).click()
  await page.keyboard.press('Escape')
  await expect(mode).toHaveCount(0)

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

test('opens Zen on the green card and breathes in the full-screen breathing mode', async ({
  page,
}) => {
  await signInAsReadyPerson(page)
  await mainNavigation(page).getByRole('link', { name: 'Zen' }).click()

  const card = page.getByTestId('zen-card')
  await expect(card.getByRole('heading', { level: 1, name: 'Zen Space' })).toBeVisible()
  await expect(card.getByRole('button', { name: 'Pausar o som de fundo: Mar' })).toBeVisible()
  await expect(
    card
      .getByRole('button', { name: 'Pausar o som de fundo: Mar' })
      .locator('svg[data-sound="sea"]'),
  ).toBeVisible()
  await expect(card.getByRole('heading', { level: 3, name: 'Sono e humor' })).toBeVisible()
  await expect(page.locator('main svg[viewBox="0 0 300 300"]')).toHaveCount(1)
  await expect(card.locator('svg[viewBox="0 0 300 300"]')).toHaveCount(1)
  await expect(page.locator('main header')).toHaveCount(0)

  await page.getByRole('button', { name: 'Respirar 1 min' }).click()
  const mode = page.getByRole('dialog', { name: 'Respirar em quadrado' })
  await expect(mode.getByTestId('breathing-relief')).toBeVisible()
  await expect(mode.getByTestId('relief-rings').locator('path')).toHaveCount(7)
  await expect(mode.getByTestId('breathing-square')).toHaveCount(0)
  await expect(mode.getByTestId('breathing-dot')).toHaveCount(0)
  const viewport = page.viewportSize()
  const box = await mode.boundingBox()
  expect(box?.width).toBe(viewport?.width)
  expect(box?.height).toBe(viewport?.height)

  await mode.getByRole('button', { name: 'Começar' }).click()
  await expect(mode.getByRole('status')).toHaveText('Inspire')
  await expect(mode.getByText('Inspire', { exact: true }).first()).toBeVisible()
  await expect(mode.getByText('Volta 1 de 4')).toBeVisible()
  await expect(mode.getByTestId('relief-sweep')).toHaveCount(1)
  await mode.getByRole('button', { name: 'Pausar' }).click()
  await expect(mode.getByRole('button', { name: 'Continuar' })).toBeVisible()
  await mode.getByRole('button', { name: 'Fechar' }).click()

  await expect(mode).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Respirar 1 min' })).toBeFocused()
  await expect(card.getByRole('button', { name: 'Pausar o som de fundo: Mar' })).toBeVisible()
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

test('plays the background sound on arrival in Zen and follows the sound chosen in settings', async ({
  page,
}) => {
  await signInAsReadyPerson(page)
  await expect(page.getByRole('button', { name: /som de fundo/i })).toHaveCount(0)

  await mainNavigation(page).getByRole('link', { name: 'Zen' }).click()
  await expect(page.getByRole('button', { name: 'Pausar o som de fundo: Mar' })).toBeVisible()
  await expect(headerSound(page, 'Mar')).toHaveCount(0)
  await page.getByRole('link', { name: 'Ansiedade', exact: true }).click()
  await expect(page).toHaveURL('/zen/topics/anxiety')
  await expect(headerSound(page, 'Mar')).toHaveAttribute('aria-pressed', 'true')
  await expect(headerSound(page, 'Mar').locator('svg[data-sound="sea"]')).toBeVisible()

  await page.goto('/me/sound')
  const settings = page.getByRole('region', { name: 'Som e voz' })
  await settings.getByLabel('Qual som').selectOption('rain')
  await settings.getByText('Em todo o app').click()
  await expect(settings.getByText('Essas escolhas ficam salvas só neste aparelho.')).toBeVisible()

  await mainNavigation(page).getByRole('link', { name: 'Hoje' }).click()
  await expect(headerSound(page, 'Chuva')).toHaveAttribute('aria-pressed', 'true')
  await expect(headerSound(page, 'Chuva').locator('svg[data-sound="rain"]')).toBeVisible()
  await mainNavigation(page).getByRole('link', { name: 'Zen' }).click()
  await expect(page.getByRole('button', { name: 'Pausar o som de fundo: Chuva' })).toBeVisible()
  await expect(headerSound(page, 'Chuva')).toHaveCount(0)

  await page.goto('/me/sound')
  await page.getByRole('region', { name: 'Som e voz' }).getByText('Desligado').click()
  await mainNavigation(page).getByRole('link', { name: 'Zen' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Zen Space' })).toBeVisible()
  await expect(page.getByRole('button', { name: /som de fundo/i })).toHaveCount(0)
})

test('remembers a pause across reloads until the person plays again', async ({ page }) => {
  await signInAsReadyPerson(page)
  await mainNavigation(page).getByRole('link', { name: 'Zen' }).click()

  await page.getByRole('button', { name: 'Pausar o som de fundo: Mar' }).click()
  await expect(page.getByRole('button', { name: 'Tocar o som de fundo: Mar' })).toBeVisible()

  await page.reload()
  await page.getByRole('heading', { level: 1, name: 'Zen Space' }).click()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Tocar o som de fundo: Mar' })).toBeVisible()
  await page.goto('/zen/topics/sleep')
  await expect(headerSound(page, 'Mar')).toHaveAttribute('aria-pressed', 'false')

  await page.goto('/zen')
  await page.getByRole('button', { name: 'Tocar o som de fundo: Mar' }).click()
  await expect(page.getByRole('button', { name: 'Pausar o som de fundo: Mar' })).toBeVisible()
  await page.reload()
  await page.getByRole('heading', { level: 1, name: 'Zen Space' }).click()
  await expect(page.getByRole('button', { name: 'Pausar o som de fundo: Mar' })).toBeVisible()
})

test('chooses, previews and keeps each of the new background sounds', async ({ page }) => {
  await signInAsReadyPerson(page)
  await page.goto('/me/sound')
  await page.waitForLoadState('networkidle')
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
    await expect(async () => {
      await sound.selectOption(id)
      await expect(sound).toHaveValue(id, { timeout: 2000 })
    }).toPass()
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
    await expect(
      page.getByRole('button', { name: new RegExp(`o som de fundo: ${name}$`) }),
    ).toBeVisible()
    await page.goto('/me/sound')
    await page.waitForLoadState('networkidle')
  }
})

const sleepNights: readonly CheckInSeed[] = Array.from({ length: 3 }, () => ({
  moodLevel: 3,
  emotions: ['tiredness'],
  contexts: ['sleep'],
  note: null,
}))

test('suggests sleep after several sleep check-ins and says why in one sentence', async ({
  page,
}) => {
  await signInAsReadyPerson(page, null, { checkIns: sleepNights })
  await mainNavigation(page).getByRole('link', { name: 'Zen' }).click()

  await expect(today(page)).toContainText('Sono e descanso · passo 1 de 5')
  await today(page).getByRole('button', { name: 'Por que esta sugestão?' }).click()
  await expect(today(page).getByText('O sono apareceu em vários registros recentes.')).toBeVisible()
  await expect(today(page).getByText('É noite: um passo para descansar.')).toHaveCount(0)
})

test('puts sleep and a breathing minute first at night in the person own time zone', async ({
  page,
}) => {
  await signInAsReadyPerson(
    page,
    { phq9: Array.from({ length: 9 }, () => 0), gad7: [2, 2, 2, 2, 2, 2, 2] },
    { hour: night },
  )
  await mainNavigation(page).getByRole('link', { name: 'Zen' }).click()

  await expect(today(page)).toContainText('Sono e descanso · passo 1 de 5')
  const breathe = today(page).getByRole('button', { name: 'Respirar 1 min' })
  const breatheBox = await breathe.boundingBox()
  const cardBox = await page.getByTestId('zen-card').boundingBox()
  expect((breatheBox?.y ?? 0) + (breatheBox?.height ?? 0)).toBeLessThan(cardBox?.y ?? 0)
  await today(page).getByRole('button', { name: 'Por que esta sugestão?' }).click()
  await expect(today(page).getByText('É noite: um passo para descansar.')).toBeVisible()
})

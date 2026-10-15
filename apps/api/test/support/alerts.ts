import { expect } from '@jest/globals'
import { sharingConsentVersion, type InstrumentId } from '@mycogni/domain'
import type { Database } from '../../src/db/client.ts'
import { createMailer } from '../../src/mail/mailer.ts'
import { createAlertJob, type AlertJob } from '../../src/modules/alerts/alert-job.ts'
import { createAlertStore } from '../../src/modules/alerts/alert-store.ts'
import { createPatientMetricsRepository } from '../../src/modules/care-links/patient-metrics.repository.ts'
import type { App } from '../../src/shared/http.ts'
import { bearer, type TestUser } from './supabase.ts'
import { allowedOrigin, testConfig } from './test-app.ts'

export const severeWithRisk = [3, 3, 3, 3, 3, 3, 3, 3, 2]

export function testAlertJob(db: Database, professionalIds: readonly string[]): AlertJob {
  const store = createAlertStore(db)
  return createAlertJob({
    store: {
      ...store,
      async activeLinks(filter) {
        const links = await store.activeLinks(filter)
        return links.filter((link) => professionalIds.includes(link.professionalId))
      },
    },
    metrics: createPatientMetricsRepository(db),
    mailer: createMailer(testConfig.mail, { error: () => undefined }),
    webUrl: allowedOrigin,
    now: () => new Date(),
  })
}

export async function send(app: App, user: TestUser, url: string, payload?: object) {
  const response = await app.inject({ method: 'POST', url, headers: bearer(user), payload })
  expect(response.statusCode).toBeLessThan(300)
  return response
}

export async function linkPatient(
  app: App,
  professional: TestUser,
  patient: TestUser,
  sharesHistory: boolean,
): Promise<string> {
  const created = await send(app, professional, '/v1/invitations', {
    channel: 'link',
    locale: 'pt-BR',
  })
  const { code } = created.json<{ invitation: { code: string } }>().invitation
  const claimed = (await send(app, patient, '/v1/invitations/claim', { code })).json<{
    id: string
  }>()
  const accepted = await send(app, patient, `/v1/invitations/${claimed.id}/accept`, {
    sharesHistory,
    consentVersion: sharingConsentVersion,
  })
  return accepted.json<{ id: string }>().id
}

export async function answer(
  app: App,
  patient: TestUser,
  instrument: InstrumentId,
  answers: readonly number[],
): Promise<string> {
  const response = await send(app, patient, '/v1/assessments', { instrument, answers })
  return response.json<{ id: string }>().id
}

import { professionalInsightContentSchema } from '@mycogni/contracts'
import {
  alertsFor,
  cooldownStart,
  emailsRightAway,
  emailWindowStart,
  isLocale,
  type Alert,
  type Locale,
} from '@mycogni/domain'
import type { AlertTrigger } from '../../jobs/alert-trigger.ts'
import type { Mailer } from '../../mail/mailer.ts'
import { loadPatientSignals } from '../care-links/attention-signals.ts'
import type { PatientMetricsRepository } from '../care-links/patient-metrics.repository.ts'
import { alertEmail } from './alert-email.ts'
import type { AlertLink, AlertStore } from './alert-store.ts'

export interface AlertOutcome {
  raised: number
  emailed: number
}

export interface AlertJob {
  run(trigger: AlertTrigger): Promise<AlertOutcome>
}

export interface AlertJobDependencies {
  store: AlertStore
  metrics: PatientMetricsRepository
  mailer: Mailer
  webUrl: string
  now: () => Date
}

interface Evaluation {
  link: AlertLink
  alerts: Alert[]
}

const fallbackLocale: Locale = 'pt-BR'

const nothing: AlertOutcome = { raised: 0, emailed: 0 }

function groupByProfessional(links: readonly AlertLink[]): Map<string, AlertLink[]> {
  const groups = new Map<string, AlertLink[]>()
  for (const link of links) {
    groups.set(link.professionalId, [...(groups.get(link.professionalId) ?? []), link])
  }
  return groups
}

export function createAlertJob({
  store,
  metrics,
  mailer,
  webUrl,
  now,
}: AlertJobDependencies): AlertJob {
  async function email(alertId: string, link: AlertLink, at: Date): Promise<boolean> {
    if (!(await store.claimEmail(alertId, link, { since: emailWindowStart(at), at }))) {
      return false
    }
    const recipient = await store.recipient(link)
    const sent =
      recipient !== undefined &&
      (await mailer.send(
        alertEmail({
          to: recipient.email,
          locale: isLocale(recipient.locale) ? recipient.locale : fallbackLocale,
          patientName: recipient.patientName,
          link: `${webUrl}/pro/alerts`,
        }),
      ))
    if (!sent) {
      await store.releaseEmail(alertId)
    }
    return sent
  }

  async function raise(evaluations: readonly Evaluation[], at: Date): Promise<AlertOutcome> {
    const outcome = { ...nothing }
    for (const { link, alerts } of evaluations) {
      for (const alert of alerts) {
        const id = await store.raise({ link, ...alert }, cooldownStart(alert.reason, at))
        if (id === null) {
          continue
        }
        outcome.raised += 1
        if (emailsRightAway(alert.level) && (await email(id, link, at))) {
          outcome.emailed += 1
        }
      }
    }
    return outcome
  }

  async function mood(patientId: string, at: Date): Promise<Evaluation[]> {
    const evaluations: Evaluation[] = []
    for (const link of await store.activeLinks({ patientId })) {
      const [loaded] = await loadPatientSignals(metrics, link.professionalId, [link], at)
      if (loaded !== undefined) {
        evaluations.push({ link, alerts: alertsFor({ kind: 'check_in', signals: loaded.signals }) })
      }
    }
    return evaluations
  }

  async function screening(patientId: string, assessmentId: string): Promise<Evaluation[]> {
    const evaluations: Evaluation[] = []
    for (const link of await store.activeLinks({ patientId })) {
      const result = await store.visibleScreening(link, assessmentId)
      if (result !== undefined) {
        evaluations.push({ link, alerts: alertsFor({ kind: 'screening', result }) })
      }
    }
    return evaluations
  }

  async function summary(insightId: string): Promise<Evaluation[]> {
    const record = await store.professionalSummary(insightId)
    const content = professionalInsightContentSchema.safeParse(record?.content)
    if (record === undefined || !content.success) {
      return []
    }
    const links = await store.activeLinks({
      professionalId: record.professionalId,
      patientId: record.patientId,
    })
    return links.map((link) => ({
      link,
      alerts: alertsFor({ kind: 'summary', attention: content.data.attention }),
    }))
  }

  async function daily(at: Date): Promise<Evaluation[]> {
    const evaluations: Evaluation[] = []
    for (const [professionalId, links] of groupByProfessional(await store.activeLinks({}))) {
      for (const { link, signals } of await loadPatientSignals(
        metrics,
        professionalId,
        links,
        at,
      )) {
        evaluations.push({ link, alerts: alertsFor({ kind: 'daily', signals }) })
      }
    }
    return evaluations
  }

  function evaluate(trigger: AlertTrigger, at: Date): Promise<Evaluation[]> {
    switch (trigger.kind) {
      case 'check-in':
        return mood(trigger.patientId, at)
      case 'assessment':
        return screening(trigger.patientId, trigger.assessmentId)
      case 'summary':
        return summary(trigger.insightId)
      case 'daily':
        return daily(at)
    }
  }

  return {
    async run(trigger) {
      const at = now()
      return raise(await evaluate(trigger, at), at)
    },
  }
}

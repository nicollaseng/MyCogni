import type { AlertCount, AlertQuery, ProfessionalAlert } from '@mycogni/contracts'
import { alertStatusOf } from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { ForbiddenError, NotFoundError } from '../../shared/errors.ts'
import type { ProfessionalRepository } from '../professionals/professional.repository.ts'
import type { AlertRecord, AlertRepository } from './alert.repository.ts'

export interface AlertService {
  list(user: AuthenticatedUser, query: AlertQuery): Promise<ProfessionalAlert[]>
  count(user: AuthenticatedUser): Promise<AlertCount>
  acknowledge(user: AuthenticatedUser, id: string): Promise<void>
  resolve(user: AuthenticatedUser, id: string): Promise<void>
}

export interface AlertServiceDependencies {
  alerts: AlertRepository
  professionals: ProfessionalRepository
}

const listLimit = 500

function toAlert(record: AlertRecord): ProfessionalAlert {
  return {
    ...record,
    status: alertStatusOf(record),
    createdAt: record.createdAt.toISOString(),
    acknowledgedAt: record.acknowledgedAt?.toISOString() ?? null,
    resolvedAt: record.resolvedAt?.toISOString() ?? null,
  }
}

export function createAlertService({
  alerts,
  professionals,
}: AlertServiceDependencies): AlertService {
  async function requireVerified(user: AuthenticatedUser): Promise<void> {
    const professional = await professionals.find(user.id)
    if (professional?.status !== 'verified') {
      throw new ForbiddenError('Only verified professionals receive alerts')
    }
  }

  async function change(
    user: AuthenticatedUser,
    id: string,
    action: 'acknowledge' | 'resolve',
  ): Promise<void> {
    await requireVerified(user)
    if (!(await alerts[action](user.id, id))) {
      throw new NotFoundError('No open alert with this id')
    }
  }

  return {
    async list(user, { patientId }) {
      await requireVerified(user)
      return (await alerts.list(user.id, { patientId, limit: listLimit })).map(toAlert)
    },
    async count(user) {
      await requireVerified(user)
      return alerts.count(user.id)
    },
    acknowledge(user, id) {
      return change(user, id, 'acknowledge')
    },
    resolve(user, id) {
      return change(user, id, 'resolve')
    },
  }
}

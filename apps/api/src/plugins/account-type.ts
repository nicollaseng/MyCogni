import type { AccountType } from '@mycogni/domain'
import type { AccountTypeReader } from '../auth/account-types.ts'
import { AccountTypeError } from '../shared/errors.ts'
import type { App } from '../shared/http.ts'
import { currentUser } from './authentication.ts'

declare module 'fastify' {
  interface FastifyContextConfig {
    accountType?: AccountType
  }
}

export const forPatients = { accountType: 'patient' } as const

export const forProfessionals = { accountType: 'professional' } as const

export function requireAccountType(app: App, accounts: AccountTypeReader): void {
  app.addHook('onRequest', async (request) => {
    const required = request.routeOptions.config.accountType
    if (required === undefined) {
      return
    }
    if ((await accounts.typeOf(currentUser(request).id)) !== required) {
      throw new AccountTypeError(required)
    }
  })
}

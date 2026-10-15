import { admin as american } from '../en-US/admin'
import type { AdminMessages } from '../pt-BR/admin'

export const admin: AdminMessages = {
  ...american,
  professionals: {
    ...american.professionals,
    description:
      'Check the name and the registration before approving. Only verified professionals can invite patients.',
    registration: 'Registration',
    noRegistration: 'No registration',
  },
}
